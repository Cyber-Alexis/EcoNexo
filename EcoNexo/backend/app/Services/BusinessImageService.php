<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Image;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BusinessImageService
{
    /**
     * Upload main image for a business.
     * Replaces existing main image if present.
     *
     * @param Business $business
     * @param UploadedFile $file
     * @return Image
     */
    public function uploadMainImage(Business $business, UploadedFile $file): Image
    {
        return DB::transaction(function () use ($business, $file) {
            // Delete existing main image(s)
            $existingMain = $business->images()->where('type', 'main')->get();
            
            foreach ($existingMain as $image) {
                $this->deleteImageFile($image);
                $image->delete();
            }

            // Store new image
            $path = $file->store("businesses/{$business->id}/main", 'public');

            // Create database record
            return $business->images()->create([
                'path' => $path,
                'type' => 'main',
                'position' => 0,
            ]);
        });
    }

    /**
     * Upload gallery images for a business.
     * Maintains maximum of 6 gallery images.
     *
     * @param Business $business
     * @param array<UploadedFile> $files
     * @return array<Image>
     */
    public function uploadGalleryImages(Business $business, array $files): array
    {
        return DB::transaction(function () use ($business, $files) {
            $currentGalleryCount = $business->images()->where('type', 'gallery')->count();
            $availableSlots = 6 - $currentGalleryCount;

            if ($availableSlots <= 0) {
                throw new \Exception('Ya tienes el máximo de 6 imágenes en la galería. Elimina alguna antes de subir más.');
            }

            $filesToUpload = array_slice($files, 0, $availableSlots);
            $uploadedImages = [];

            // Get next position number
            $nextPosition = $business->images()
                ->where('type', 'gallery')
                ->max('position') + 1;

            foreach ($filesToUpload as $file) {
                $path = $file->store("businesses/{$business->id}/gallery", 'public');

                $image = $business->images()->create([
                    'path' => $path,
                    'type' => 'gallery',
                    'position' => $nextPosition++,
                ]);

                $uploadedImages[] = $image;
            }

            return $uploadedImages;
        });
    }

    /**
     * Delete an image and reorganize positions if needed.
     *
     * @param Business $business
     * @param int $imageId
     * @return bool
     */
    public function deleteImage(Business $business, int $imageId): bool
    {
        return DB::transaction(function () use ($business, $imageId) {
            $image = $business->images()->where('id', $imageId)->first();

            if (!$image) {
                throw new \Exception('La imagen no existe o no pertenece a tu negocio.');
            }

            $imageType = $image->type;
            $imagePosition = $image->position;

            // Delete file from storage
            $this->deleteImageFile($image);

            // Delete database record
            $image->delete();

            // Reorganize positions if it was a gallery image
            if ($imageType === 'gallery') {
                $this->reorganizeGalleryPositions($business, $imagePosition);
            }

            return true;
        });
    }

    /**
     * Delete the physical file from storage.
     *
     * @param Image $image
     * @return void
     */
    private function deleteImageFile(Image $image): void
    {
        $rawPath = $image->getRawOriginal('path');

        if ($rawPath && !preg_match('/^https?:\/\//i', $rawPath)) {
            Storage::disk('public')->delete($rawPath);
        }
    }

    /**
     * Reorganize gallery positions after deletion.
     *
     * @param Business $business
     * @param int $deletedPosition
     * @return void
     */
    private function reorganizeGalleryPositions(Business $business, int $deletedPosition): void
    {
        $business->images()
            ->where('type', 'gallery')
            ->where('position', '>', $deletedPosition)
            ->decrement('position');
    }

    /**
     * Load all images for a business with proper ordering.
     *
     * @param Business $business
     * @return void
     */
    public function loadImages(Business $business): void
    {
        $business->load([
            'images' => function ($query) {
                $query->orderBy('type', 'desc') // main first
                      ->orderBy('position');
            }
        ]);
    }
}
