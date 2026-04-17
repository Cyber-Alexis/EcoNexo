<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Get all available product categories.
     */
    public function categories()
    {
        $categories = Category::whereHas('products', function ($query) {
            $query->where('active', true);
        })
        ->orderBy('name', 'asc')
        ->pluck('name');

        return response()->json(['categories' => $categories]);
    }

    /**
     * Display a listing of all products with pagination.
     */
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 12);
        $category = $request->get('category');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = Product::with(['business', 'category', 'images'])
            ->where('active', true);

        // Filter by category
        if ($category && $category !== 'Todas') {
            $query->whereHas('category', function ($q) use ($category) {
                $q->where('name', $category);
            });
        }

        // Search in name, description, business name or category
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhereHas('business', function ($bq) use ($search) {
                        $bq->where('name', 'LIKE', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        // Sorting
        if ($sortBy === 'price') {
            $query->orderBy('price', $sortOrder);
        } else {
            $query->orderBy('name', $sortOrder);
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * GET /api/mis-productos
     * Returns all products belonging to the authenticated business owner.
     */
    public function mine()
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json(['message' => 'Solo los negocios pueden gestionar productos.'], 403);
        }

        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 404);
        }

        $products = Product::with(['category', 'images'])
            ->where('business_id', $business->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['products' => $products]);
    }

    /**
     * POST /api/mis-productos
     * Creates a new product for the authenticated business owner.
     */
    public function store(Request $request)
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json(['message' => 'Solo los negocios pueden crear productos.'], 403);
        }

        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 404);
        }

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price'       => 'required|numeric|min:0',
            'price_unit'  => 'nullable|string|max:50',
            'stock'       => 'required|integer|min:0',
            'category'    => 'required|string|max:120',
            'active'      => 'boolean',
            'image'       => 'nullable|image|max:4096',
        ]);

        // Find or create category scoped to this business
        $category = Category::firstOrCreate(
            ['business_id' => $business->id, 'name' => $validated['category']],
            ['description' => null]
        );

        $product = Product::create([
            'business_id'  => $business->id,
            'category_id'  => $category->id,
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'price'        => $validated['price'],
            'price_unit'   => $validated['price_unit'] ?? 'unidad',
            'stock'        => $validated['stock'],
            'active'       => true,  // Always active on creation; owner can deactivate via edit
        ]);

        // Handle image upload
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $product->images()->create([
                'path' => Storage::url($path),
                'type' => 'main',
            ]);
        }

        $product->load(['category', 'images']);

        return response()->json(['message' => 'Producto creado correctamente.', 'product' => $product], 201);
    }

    /**
     * PUT /api/mis-productos/{id}
     * Updates a product owned by the authenticated business.
     */
    public function update(Request $request, $id)
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json(['message' => 'Solo los negocios pueden editar productos.'], 403);
        }

        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 404);
        }

        $product = Product::where('business_id', $business->id)->findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'price'       => 'required|numeric|min:0',
            'price_unit'  => 'nullable|string|max:50',
            'stock'       => 'required|integer|min:0',
            'category'    => 'required|string|max:120',
            'active'      => 'boolean',
            'image'       => 'nullable|image|max:4096',
        ]);

        // Find or create category scoped to this business
        $category = Category::firstOrCreate(
            ['business_id' => $business->id, 'name' => $validated['category']],
            ['description' => null]
        );

        $product->update([
            'category_id'  => $category->id,
            'name'         => $validated['name'],
            'description'  => $validated['description'] ?? null,
            'price'        => $validated['price'],
            'price_unit'   => $validated['price_unit'] ?? 'unidad',
            'stock'        => $validated['stock'],
            'active'       => $request->has('active') ? $request->boolean('active') : $product->active,
        ]);

        // Handle image upload - replace existing main image
        if ($request->hasFile('image')) {
            $existingMain = $product->images()->where('type', 'main')->first();
            if ($existingMain) {
                $oldPath = str_replace('/storage/', '', $existingMain->path);
                Storage::disk('public')->delete($oldPath);
                $existingMain->delete();
            }
            $path = $request->file('image')->store('products', 'public');
            $product->images()->create([
                'path' => Storage::url($path),
                'type' => 'main',
            ]);
        }

        $product->load(['category', 'images']);

        return response()->json(['message' => 'Producto actualizado correctamente.', 'product' => $product]);
    }

    /**
     * PATCH /api/mis-productos/{id}/toggle-active
     * Toggles the active status of a product.
     */
    public function toggleActive($id)
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json(['message' => 'Solo los negocios pueden editar productos.'], 403);
        }

        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 404);
        }

        $product = Product::where('business_id', $business->id)->findOrFail($id);
        $product->update(['active' => !$product->active]);
        $product->load(['category', 'images']);

        return response()->json(['message' => 'Estado actualizado.', 'product' => $product]);
    }

    /**
     * DELETE /api/mis-productos/{id}
     * Deletes a product owned by the authenticated business.
     */
    public function destroy($id)
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'business') {
            return response()->json(['message' => 'Solo los negocios pueden eliminar productos.'], 403);
        }

        $business = $user->business;

        if (!$business) {
            return response()->json(['message' => 'No tienes un negocio registrado.'], 404);
        }

        $product = Product::where('business_id', $business->id)->findOrFail($id);

        // Delete associated images from storage
        foreach ($product->images as $image) {
            $oldPath = str_replace('/storage/', '', $image->path);
            Storage::disk('public')->delete($oldPath);
        }

        $product->images()->delete();
        $product->delete();

        return response()->json(['message' => 'Producto eliminado correctamente.']);
    }

}

