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
        'imageable_id', 'imageable_type', 'path', 'type',
    ];

    public function imageable()
    {
        return $this->morphTo();
    }

    public function getPathAttribute(?string $value): ?string
    {
        if (!$value) {
            return $value;
        }

        if (Str::startsWith($value, ['http://', 'https://', 'data:'])) {
            return $value;
        }

        return Storage::disk('public')->url($value);
    }
}
