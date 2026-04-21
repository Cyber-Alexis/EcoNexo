<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadBusinessImagesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('api')->check() && auth('api')->user()->role === 'business';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => 'required|in:main,gallery',
            'images' => 'required|array|min:1|max:6',
            'images.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096', // 4MB max
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'El tipo de imagen es obligatorio.',
            'type.in' => 'El tipo debe ser "main" o "gallery".',
            'images.required' => 'Debes seleccionar al menos una imagen.',
            'images.array' => 'El formato de imágenes no es válido.',
            'images.min' => 'Debes seleccionar al menos una imagen.',
            'images.max' => 'Puedes subir un máximo de 6 imágenes a la vez.',
            'images.*.required' => 'Cada imagen es obligatoria.',
            'images.*.image' => 'El archivo debe ser una imagen.',
            'images.*.mimes' => 'Solo se permiten imágenes JPG, JPEG, PNG o WEBP.',
            'images.*.max' => 'Cada imagen no puede superar los 4MB.',
        ];
    }
}
