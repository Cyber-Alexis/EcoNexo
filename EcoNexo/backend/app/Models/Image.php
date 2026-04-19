<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'imageable_id',
        'imageable_type',
        'path',
        'type',
        'position',
    ];

    protected $appends = ['url'];

    public function imageable()
    {
        return $this->morphTo();
    }

    /**
     * Get the full URL for the image.
     * This handles both external URLs and local storage paths.
     */
    public function getUrlAttribute(): ?string
    {
        $path = $this->attributes['path'] ?? null;

        if (!$path) {
            return null;
        }

        // If it's already a full URL, return as-is
        if (Str::startsWith($path, ['http://', 'https://', 'data:'])) {
            return $path;
        }

        // For local storage, use the public disk URL
        return Storage::disk('public')->url($path);
    }

    /**
     * Get the path attribute (keep original value for storage operations).
     */
    public function getPathAttribute(?string $value): ?string
    {
        return $value;
    }

    /**
     * Scope to order by position.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position');
    }
}
