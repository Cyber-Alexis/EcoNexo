<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Seeder;

class BusinessSeeder extends Seeder
{
    public function run(): void
    {
        $businesses = [
            [
                'email'       => 'pere@calpep.com',
                'name'        => 'Cal Pep',
                'description' => 'Frutería familiar con más de 30 años de experiencia. Ofrecemos frutas y verduras de proximidad, directamente de los productores locales de la comarca de Lleida.',
                'address'     => 'Carrer Major, 12',
                'city'        => 'Lleida',
                'phone'       => '973123456',
                'opening_hours' => 'Lun-Sáb: 8:00-14:00, 17:00-20:00',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80',
                    'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80',
                    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
                ],
                'categories' => [
                    ['name' => 'Frutas y Verduras', 'description' => 'Productos frescos de la comarca'],
                    ['name' => 'Productos Frescos', 'description' => 'Productos del día'],
                    ['name' => 'Ecológico', 'description' => 'Productos ecológicos certificados'],
                ],
            ],
            [
                'email'       => 'rosa@forndelaplaca.com',
                'name'        => 'Forn de la Plaça',
                'description' => 'Horno artesano con recetas tradicionales. Nuestro pan de masa madre es elaborado diariamente con ingredientes ecológicos seleccionados.',
                'address'     => 'Plaça Paeria, 3',
                'city'        => 'Lleida',
                'phone'       => '973234567',
                'opening_hours' => 'Lun-Vie: 7:00-14:00, 17:00-20:30, Sáb: 7:00-14:00', 
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
                    'https://images.unsplash.com/photo-1585518419759-aedc8dbd1e5a?w=800&q=80',
                ],
                'categories' => [
                    ['name' => 'Pan y Pastelería', 'description' => 'Pan artesano y productos de repostería'],
                    ['name' => 'Artesanal', 'description' => 'Elaboración tradicional'],
                    ['name' => 'Ecológico', 'description' => 'Ingredientes ecológicos seleccionados'],
                ],
            ],
            [
                'email'       => 'miquel@bodegasiurana.com',
                'name'        => 'Bodega Siurana',
                'description' => 'Bodega familiar del Priorat con viñas de más de 50 años. Elaboramos vinos naturales y cavas artesanos reconocidos internacionalmente.',
                'address'     => 'Carrer del Vi, 8',
                'city'        => 'Lleida',
                'phone'       => '973345678',
                'opening_hours' => 'Lun-Vie: 7:00-14:00, 17:00-20:30, Sáb: 7:00-14:00', // 'Lun-Vie: 10:00-14:00, 16:00-20:00, Sáb: 10:00-14:00'
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1595217707533-1d36f4f46117?w=800&q=80',
                    'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
                    'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=800&q=80',
                ],
                'categories' => [
                    ['name' => 'Vinos y Cavas', 'description' => 'Vinos y cavas artesanos del Priorat'],
                    ['name' => 'Bebidas', 'description' => 'Bebidas alcohólicas de calidad'],
                    ['name' => 'Artesanal', 'description' => 'Elaboración familiar tradicional'],
                ],
            ],
            [
                'email'       => 'anna@carnisseriamolins.com',
                'name'        => 'Carnisseria Molins',
                'description' => 'Carnicería de confianza con producto fresco local. Todos nuestros animales provienen de granjas sostenibles de la comarca.',
                'address'     => 'Avinguda Catalunya, 21',
                'city'        => 'Lleida',
                'phone'       => '973456789',
                'opening_hours' => 'Lun-Vie: 8:30-14:00, 17:00-20:00, Sáb: 8:30-14:00',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
                    'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=800&q=80',
                    'https://images.unsplash.com/photo-1560781290-7dc94c0f8f4f?w=800&q=80',
                ],
                'categories' => [
                    ['name' => 'Carne y Embutidos', 'description' => 'Carne fresca y productos cárnicos'],
                    ['name' => 'Productos Frescos', 'description' => 'Productos del día'],
                    ['name' => 'Local', 'description' => 'De granjas de la comarca'],
                ],
            ],
            [
                'email'       => 'clara@floristeria.com',
                'name'        => 'Floristeria Natura',
                'description' => 'Floristería ecológica especializada en flores de temporada y arreglos artesanos. Trabajamos con productores locales y evitamos los pesticidas.',
                'address'     => 'Carrer Sant Antoni, 5',
                'city'        => 'Lleida',
                'phone'       => '973567890',
                'opening_hours' => 'Lun-Sáb: 9:00-13:30, 16:30-20:00',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1577279607108-7b3e14675d94?w=800&q=80',
                    'https://images.unsplash.com/photo-1487530811015-780c99e72b10?w=800&q=80',
                    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80',
                ],
                'categories' => [
                    ['name' => 'Flores y Plantas', 'description' => 'Flores de temporada y plantas naturales'],
                    ['name' => 'Decoración', 'description' => 'Arreglos artesanos'],
                    ['name' => 'Ecológico', 'description' => 'Sin pesticidas'],
                ],
            ],
        ];

        foreach ($businesses as $data) {
            $user = User::where('email', $data['email'])->firstOrFail();

            $business = Business::create([
                'user_id'     => $user->id,
                'name'        => $data['name'],
                'description' => $data['description'],
                'address'     => $data['address'],
                'city'        => $data['city'],
                'phone'       => $data['phone'],
                'opening_hours' => $data['opening_hours'],
                'status'      => $data['status'],
            ]);

            // Main image
            $business->images()->create([
                'path' => $data['img_main'],
                'type' => 'main',
            ]);

            // Gallery images
            foreach ($data['img_gallery'] as $galleryImg) {
                $business->images()->create([
                    'path' => $galleryImg,
                    'type' => 'gallery',
                ]);
            }

            // Categories
            foreach ($data['categories'] as $category) {
                $business->categories()->create([
                    'name' => $category['name'],
                    'description' => $category['description'],
                ]);
            }
        }
    }
}
