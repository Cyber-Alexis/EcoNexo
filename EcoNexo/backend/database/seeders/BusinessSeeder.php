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
                'description' => 'Fruiteria familiar amb més de 30 anys d\'experiència. Oferim fruites i verdures de proximitat, directament dels productors locals de la comarca de Lleida.',
                'address'     => 'Carrer Major, 12',
                'city'        => 'Lleida',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=800&q=80',
                    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
                ],
            ],
            [
                'email'       => 'rosa@forndelaplaca.com',
                'name'        => 'Forn de la Plaça',
                'description' => 'Forn artesà amb receptes tradicionals. El nostre pa de massa mare és elaborat diàriament amb ingredients ecològics seleccionats.',
                'address'     => 'Plaça Paeria, 3',
                'city'        => 'Lleida',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
                    'https://images.unsplash.com/photo-1585518419759-aedc8dbd1e5a?w=800&q=80',
                ],
            ],
            [
                'email'       => 'miquel@bodegasiurana.com',
                'name'        => 'Bodega Siurana',
                'description' => 'Celler familiar del Priorat amb vinyes de més de 50 anys. Elaborem vins naturals i caves artesans reconeguts internacionalment.',
                'address'     => 'Carrer del Vi, 8',
                'city'        => 'Lleida',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
                    'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80',
                ],
            ],
            [
                'email'       => 'anna@carnisseriamolins.com',
                'name'        => 'Carnisseria Molins',
                'description' => 'Carnisseria de confiança amb producte fresc local. Tots els nostres animals provenen de granges sostenibles de la comarca.',
                'address'     => 'Avinguda Catalunya, 21',
                'city'        => 'Lleida',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80',
                ],
            ],
            [
                'email'       => 'clara@floristeria.com',
                'name'        => 'Floristeria Natura',
                'description' => 'Florísteria ecològica especialitzada en flors de temporada i arranjaments artesans. Treballem amb productors locals i evitem els pesticides.',
                'address'     => 'Carrer Sant Antoni, 5',
                'city'        => 'Lleida',
                'status'      => 'active',
                'img_main'    => 'https://images.unsplash.com/photo-1487530811015-780c99e72b10?w=800&q=80',
                'img_gallery' => [
                    'https://images.unsplash.com/photo-1577279607108-7b3e14675d94?w=800&q=80',
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
        }
    }
}
