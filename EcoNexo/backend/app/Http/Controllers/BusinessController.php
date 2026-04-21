<?php

namespace App\Http\Controllers;

use App\Http\Requests\UploadBusinessImagesRequest;
use App\Models\Business;
use App\Models\Image;
use App\Services\BusinessImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BusinessController extends Controller
{
    /**
     * @var BusinessImageService
     */
    private BusinessImageService $imageService;

    public function __construct(BusinessImageService $imageService)
    {
        $this->imageService = $imageService;
    }
    /**
     * GET /api/negocios
     * Returns all active businesses with avg rating, review count and main image.
     */
    public function index()
    {
        $businesses = Business::where('status', 'active')
            ->withAvg('reviews', 'rating')
            ->withCount('reviews')
            ->with([
                'images' => fn ($q) => $q->where('type', 'main')->limit(1),
                'categories' => fn ($q) => $q->select(['id', 'business_id', 'name']),
                'user:id,name,last_name,email',
            ])
            ->get();

        return response()->json($businesses);
    }

    /**
     * GET /api/negocios/{id}
     * Returns a single business with its products (with images), reviews (with user) and gallery images.
     */
    public function show(Business $business)
    {
        $business->load([
            'user:id,name,last_name,email',
            'images' => fn ($q) => $q->orderBy('type', 'desc')->orderBy('position'),
            'categories' => fn ($q) => $q->select(['id', 'business_id', 'name']),
            'products' => fn ($q) => $q->where('active', 1)->with('images'),
            'reviews' => fn ($q) => $q->with('user')->latest()->limit(20),
        ]);

        $business->loadAvg('reviews', 'rating');
        $business->loadCount('reviews');

        return response()->json($business);
    }

    /**
     * GET /api/mi-negocio
     * Returns the business owned by the authenticated business user.
     */
    public function mine()
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json([
                'message' => 'Solo los usuarios negocio pueden gestionar esta sección.',
            ], 403);
        }

        $business = $this->resolveOwnedBusiness($user);
        $this->loadOwnerBusinessRelations($business);

        return response()->json($business);
    }

    /**
     * PUT /api/mi-negocio
     * Updates the public profile for the authenticated business user.
     */
    public function updateMine(Request $request)
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json([
                'message' => 'Solo los usuarios negocio pueden gestionar esta sección.',
            ], 403);
        }

        $data = $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'category_name' => 'nullable|string|max:120',
            'description' => 'nullable|string|max:2000',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:30',
            'contact_person_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $user->id,
            'website' => 'nullable|string|max:255',
            'opening_hours' => 'nullable|string|max:255',
            'main_image' => 'nullable|url|max:2048',
        ]);

        if (!empty($data['website']) && !preg_match('/^https?:\/\//i', $data['website'])) {
            $data['website'] = 'https://' . ltrim($data['website'], '/');
        }

        $business = $this->resolveOwnedBusiness($user, $data['name'] ?? null);

        $user->update([
            'email' => $data['email'] ?? $user->email,
            'phone' => $data['phone'] ?? $user->phone,
            'address' => $data['address'] ?? $user->address,
            'city' => $data['city'] ?? $user->city,
            'postal_code' => $data['postal_code'] ?? $user->postal_code,
        ]);

        $business->update([
            'name' => !empty($data['name']) ? $data['name'] : $business->name,
            'description' => $data['description'] ?? $business->description,
            'address' => $data['address'] ?? $business->address,
            'city' => $data['city'] ?? $business->city,
            'postal_code' => $data['postal_code'] ?? $business->postal_code,
            'phone' => $data['phone'] ?? $business->phone,
            'contact_person_name' => $data['contact_person_name'] ?? $business->contact_person_name,
            'website' => $data['website'] ?? $business->website,
            'opening_hours' => $data['opening_hours'] ?? $business->opening_hours,
            'status' => $business->status ?: 'active',
        ]);

        if (array_key_exists('category_name', $data) && !empty($data['category_name'])) {
            // FIX: No eliminar categorías, solo actualizar o crear
            // Para evitar pérdida de productos por cascadeOnDelete
            $existingCategory = $business->categories()->first();
            
            if ($existingCategory) {
                // Actualizar categoría existente
                $existingCategory->update(['name' => $data['category_name']]);
            } else {
                // Crear nueva categoría solo si no existe ninguna
                $business->categories()->create([
                    'name' => $data['category_name'],
                ]);
            }
        }

        if (array_key_exists('main_image', $data) && !empty($data['main_image'])) {
            $business->images()->updateOrCreate(
                ['type' => 'main'],
                ['path' => $data['main_image']],
            );
        }

        $this->loadOwnerBusinessRelations($business);

        return response()->json([
            'message' => 'Información del negocio actualizada correctamente.',
            'business' => $business,
            'user' => $user->fresh(),
        ]);
    }

    /**
     * POST /api/mi-negocio/imagenes
     * Uploads images (main or gallery) for the authenticated business user.
     */
    public function uploadImages(UploadBusinessImagesRequest $request)
    {
        $user = auth('api')->user();
        $business = $this->resolveOwnedBusiness($user);

        $type = $request->validated('type');
        $files = $request->file('images', []);

        try {
            if ($type === 'main') {
                $this->imageService->uploadMainImage($business, $files[0]);
                $message = 'Imagen principal actualizada correctamente.';
            } else {
                $uploadedImages = $this->imageService->uploadGalleryImages($business, $files);
                $count = count($uploadedImages);
                $message = "Se subieron {$count} imagen(es) a la galería correctamente.";
            }

            $this->loadOwnerBusinessRelations($business);

            return response()->json([
                'success' => true,
                'message' => $message,
                'business' => $business,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * DELETE /api/mi-negocio/imagenes/{imageId}
     * Deletes a specific image owned by the authenticated business user.
     */
    public function deleteImage(int $imageId)
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los usuarios negocio pueden gestionar esta sección.',
            ], 403);
        }

        $business = $this->resolveOwnedBusiness($user);

        try {
            $this->imageService->deleteImage($business, $imageId);
            $this->loadOwnerBusinessRelations($business);

            return response()->json([
                'success' => true,
                'message' => 'Imagen eliminada correctamente.',
                'business' => $business,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    private function resolveOwnedBusiness($user, ?string $preferredName = null): Business
    {
        $fallbackName = trim((string) ($preferredName ?: $user->businesses()->value('name') ?: $user->name ?: 'Mi negocio'));

        return Business::firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $fallbackName,
                'status' => 'active',
            ],
        );
    }

    private function loadBusinessRelations(Business $business): void
    {
        $business->load([
            'user:id,name,last_name,email',
            'images',
            'categories' => fn ($q) => $q->select(['id', 'business_id', 'name']),
            'products' => fn ($q) => $q->with('images'),
            'reviews' => fn ($q) => $q->with('user')->latest()->limit(20),
        ]);

        $business->loadAvg('reviews', 'rating');
        $business->loadCount('reviews');
    }

    private function loadOwnerBusinessRelations(Business $business): void
    {
        $business->load([
            'user:id,name,last_name,email,phone,postal_code',
            'images' => fn ($q) => $q->orderBy('type', 'desc')->orderBy('position'),
            'categories' => fn ($q) => $q->select(['id', 'business_id', 'name']),
            'products' => fn ($q) => $q->where('active', true)->with('images'),
            'reviews' => fn ($q) => $q->with('user')->latest()->limit(20),
        ]);

        $business->loadAvg('reviews', 'rating');
        $business->loadCount('reviews');
    }

    private function deleteStoredImage(Image $image): void
    {
        $rawPath = $image->getRawOriginal('path');

        if ($rawPath && !preg_match('/^https?:\/\//i', $rawPath)) {
            Storage::disk('public')->delete($rawPath);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Business $business)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Business $business)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Business $business)
    {
        //
    }
}
