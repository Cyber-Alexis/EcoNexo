<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // ── Cal Pep ──────────────────────────────────────────────
            'Cal Pep' => [
                'Frutas' => [
                    [
                        'name' => 'Manzanas Golden',
                        'description' => 'Manzanas Golden de temporada, dulces y crujientes cultivadas en huertos de la comarca.',
                        'price' => 2.80, 'stock' => 100, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1560806887-1295c3f759a8?w=500&q=80',
                    ],
                    [
                        'name' => 'Naranjas de Valencia',
                        'description' => 'Naranjas de Valencia importadas por temporada, jugosas y aromáticas.',
                        'price' => 2.20, 'stock' => 80, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1582979519885-69613b4c54fd?w=500&q=80',
                    ],
                    [
                        'name' => 'Peras Conference',
                        'description' => 'Peras Conference de Lleida, la variedad más cultivada en la comarca.',
                        'price' => 2.50, 'stock' => 60, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=500&q=80',
                    ],
                ],
                'Verdures' => [
                    [
                        'name' => 'Tomates de Temporada',
                        'description' => 'Tomates rosa de temporada, carnosos y sin pesticidas.',
                        'price' => 3.50, 'stock' => 70, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=500&q=80',
                    ],
                    [
                        'name' => 'Lechuga Ecológica',
                        'description' => 'Lechuga fresca de cultivo ecológico local, recogida esta mañana.',
                        'price' => 1.50, 'stock' => 50, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1599599810694-b5ac4dd37e06?w=500&q=80',
                    ],
                    [
                        'name' => 'Espinacas Baby',
                        'description' => 'Espinacas baby tiernas, perfectas para ensaladas y salteados.',
                        'price' => 2.00, 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80',
                    ],
                ],
                'Fruits secs' => [
                    [
                        'name' => 'Nueces del Bierzo',
                        'description' => 'Nueces frescas de temporada, ricas en omega-3.',
                        'price' => 6.50, 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1612204103590-b5a3d1a59ebe?w=500&q=80',
                    ],
                    [
                        'name' => 'Almendras Marcona',
                        'description' => 'Almendras Marcona tostadas, la variedad española más apreciada.',
                        'price' => 9.00, 'stock' => 25, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1574184864703-3487b13f0edd?w=500&q=80',
                    ],
                ],
            ],

            // ── Forn de la Plaça ─────────────────────────────────────
            'Forn de la Plaça' => [
                'Pa artesà' => [
                    [
                        'name' => 'Pan de Masa Madre',
                        'description' => 'Pan artesano elaborado con masa madre de 20 años, cocción en horno de leña.',
                        'price' => 4.20, 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
                    ],
                    [
                        'name' => 'Pa Integral de Espelta',
                        'description' => 'Pa fet amb farina d\'espelta integral ecològica, alt contingut en fibra.',
                        'price' => 3.80, 'stock' => 20, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=500&q=80',
                    ],
                    [
                        'name' => 'Baguette Tradicional',
                        'description' => 'Baguette crujiente de elaboración diaria con harina local.',
                        'price' => 1.20, 'stock' => 60, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=500&q=80',
                    ],
                ],
                'Pastisseria' => [
                    [
                        'name' => 'Croissants de Mantequilla',
                        'description' => 'Croissants hojaldrados con mantequilla francesa, elaborados cada mañana.',
                        'price' => 1.80, 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1585518419759-aedc8dbd1e5a?w=500&q=80',
                    ],
                    [
                        'name' => 'Ensaïmada Mallorquina',
                        'description' => 'Ensaïmada tradicional amb saïm de porc, recepta original de Mallorca.',
                        'price' => 3.50, 'stock' => 15, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1562440499-64c9a111f713?w=500&q=80',
                    ],
                ],
                'Coca i salat' => [
                    [
                        'name' => 'Coca de Recapte',
                        'description' => 'Tradicional coca de recapte amb escalivada, tonyina i olives.',
                        'price' => 12.50, 'stock' => 10, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
                    ],
                    [
                        'name' => 'Coca de Llardons',
                        'description' => 'Coca dolça amb llardons i sucre, especialitat catalana de temporada.',
                        'price' => 8.00, 'stock' => 12, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=500&q=80',
                    ],
                ],
            ],

            // ── Bodega Siurana ────────────────────────────────────────
            'Bodega Siurana' => [
                'Vins negres' => [
                    [
                        'name' => 'Garnatxa Negra Selecció',
                        'description' => 'Vi negre de Garnatxa del Priorat, criança de 12 mesos en bóta de roure.',
                        'price' => 18.00, 'stock' => 48, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?w=500&q=80',
                    ],
                    [
                        'name' => 'Tempranillo Jove',
                        'description' => 'Vi negre jove de Tempranillo, fruitat i de fàcil beguda.',
                        'price' => 10.00, 'stock' => 60, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=500&q=80',
                    ],
                ],
                'Vins blancs' => [
                    [
                        'name' => 'Macabeu Blanc Jove',
                        'description' => 'Vi blanc jove de Macabeu, fresc i aromàtic, perfecte per als aperitius.',
                        'price' => 12.00, 'stock' => 36, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=500&q=80',
                    ],
                    [
                        'name' => 'Rosat de Garnatxa',
                        'description' => 'Vi rosat lleuger de Garnatxa, color salmó i pa llarg en boca.',
                        'price' => 11.00, 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1543218024-57a70143c369?w=500&q=80',
                    ],
                ],
                'Caves i escumosos' => [
                    [
                        'name' => 'Cava Brut Nature',
                        'description' => 'Cava espumós elaborat pel mètode tradicional, sec i elegaant.',
                        'price' => 9.50, 'stock' => 50, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1510812431401-41d2cab2707d?w=500&q=80',
                    ],
                ],
            ],

            // ── Carnisseria Molins ────────────────────────────────────
            'Carnisseria Molins' => [
                'Vedella' => [
                    [
                        'name' => 'Chuleta de Ternera',
                        'description' => 'Chuleta de ternera de primera calidad, procedente de explotaciones locales sostenibles.',
                        'price' => 22.00, 'stock' => 15, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&q=80',
                    ],
                    [
                        'name' => 'Filete de Ternera',
                        'description' => 'Filetes tiernos de la parte noble de la ternera, perfectos a la plancha.',
                        'price' => 28.00, 'stock' => 10, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=500&q=80',
                    ],
                ],
                'Porc' => [
                    [
                        'name' => 'Llom de Porc',
                        'description' => 'Llom de porc fresc de granja familiar, sense antibiòtics.',
                        'price' => 9.50, 'stock' => 25, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500&q=80',
                    ],
                    [
                        'name' => 'Botifarra Fresca',
                        'description' => 'Botifarra fresca artesana, elaborada amb carn de porc local i espècies naturals.',
                        'price' => 7.50, 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1558030137-a56c1b004fa3?w=500&q=80',
                    ],
                ],
                'Aus' => [
                    [
                        'name' => 'Pollastre de Corral',
                        'description' => 'Pollastre de corral criat en llibertat a les granges del Segrià.',
                        'price' => 8.00, 'stock' => 20, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=500&q=80',
                    ],
                ],
            ],

            // ── Floristeria Natura ────────────────────────────────────
            'Floristeria Natura' => [
                'Rams i bouquets' => [
                    [
                        'name' => 'Ram de Roses Roges',
                        'description' => 'Ram de 12 roses roges fresques de temporada, collides avui.',
                        'price' => 18.00, 'stock' => 20, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1577279607108-7b3e14675d94?w=500&q=80',
                    ],
                    [
                        'name' => 'Bouquet de Primavera',
                        'description' => 'Bouquet de temporada amb espècies variades: tulipes, freèsies i gipsòfiles.',
                        'price' => 22.00, 'stock' => 15, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1487530811015-780c99e72b10?w=500&q=80',
                    ],
                ],
                'Plantes' => [
                    [
                        'name' => 'Lavanda Ecològica',
                        'description' => 'Planta de lavanda ecològica en test de terrissa, ideal per a terrasses.',
                        'price' => 8.50, 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1471086569966-db3eebc25a59?w=500&q=80',
                    ],
                    [
                        'name' => 'Romero Aromàtic',
                        'description' => 'Planta de romaní per cuinar i decorar, cultivada sense pesticides.',
                        'price' => 4.00, 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?w=500&q=80',
                    ],
                ],
                'Arranjaments' => [
                    [
                        'name' => 'Centre de Taula de Tardor',
                        'description' => 'Centre de taula artesà amb flors i branques seques de temporada.',
                        'price' => 35.00, 'stock' => 8, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1525310072745-f49212b417ac?w=500&q=80',
                    ],
                ],
            ],
        ];

        foreach ($data as $businessName => $categories) {
            $business = Business::where('name', $businessName)->firstOrFail();

            foreach ($categories as $categoryName => $products) {
                $category = Category::where('business_id', $business->id)
                    ->where('name', $categoryName)
                    ->firstOrFail();

                foreach ($products as $productData) {
                    $product = Product::create([
                        'business_id'  => $business->id,
                        'category_id'  => $category->id,
                        'name'         => $productData['name'],
                        'description'  => $productData['description'],
                        'price'        => $productData['price'],
                        'stock'        => $productData['stock'],
                        'active'       => $productData['active'],
                    ]);

                    $product->images()->create([
                        'path' => $productData['img'],
                        'type' => 'main',
                    ]);
                }
            }
        }
    }
}
