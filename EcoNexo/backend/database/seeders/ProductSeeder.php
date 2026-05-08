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
                        'price' => 2.80, 'price_unit' => 'kg', 'stock' => 100, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=500&q=80',
                    ],
                    [
                        'name' => 'Naranjas de Valencia',
                        'description' => 'Naranjas de Valencia importadas por temporada, jugosas y aromáticas.',
                        'price' => 2.20, 'price_unit' => 'kg', 'stock' => 80, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80',
                    ],
                    [
                        'name' => 'Peras Conference',
                        'description' => 'Peras Conference de Lleida, la variedad más cultivada en la comarca.',
                        'price' => 2.50, 'price_unit' => 'kg', 'stock' => 60, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=500&q=80',
                    ],
                ],
                'Verdures' => [
                    [
                        'name' => 'Tomates de Temporada',
                        'description' => 'Tomates rosa de temporada, carnosos y sin pesticidas.',
                        'price' => 3.50, 'price_unit' => 'kg', 'stock' => 70, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
                    ],
                    [
                        'name' => 'Lechuga Ecológica',
                        'description' => 'Lechuga fresca de cultivo ecológico local, recogida esta mañana.',
                        'price' => 1.50, 'price_unit' => 'unidad', 'stock' => 50, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&q=80',
                    ],
                    [
                        'name' => 'Espinacas Baby',
                        'description' => 'Espinacas baby tiernas, perfectas para ensaladas y salteados.',
                        'price' => 2.00, 'price_unit' => 'bolsa', 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80',
                    ],
                ],
                'Fruits secs' => [
                    [
                        'name' => 'Nueces del Bierzo',
                        'description' => 'Nueces frescas de temporada, ricas en omega-3.',
                        'price' => 6.50, 'price_unit' => 'kg', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1622542796246-c0f933fe6a1b?w=500&q=80',
                    ],
                    [
                        'name' => 'Almendras Marcona',
                        'description' => 'Almendras Marcona tostadas, la variedad española más apreciada.',
                        'price' => 9.00, 'price_unit' => 'kg', 'stock' => 25, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1508747703725-719777637510?w=500&q=80',
                    ],
                ],
            ],

            // ── Forn de la Plaça ─────────────────────────────────────
            'Forn de la Plaça' => [
                'Pa artesà' => [
                    [
                        'name' => 'Pan de Masa Madre',
                        'description' => 'Pan artesano elaborado con masa madre de 20 años, cocción en horno de leña.',
                        'price' => 4.20, 'price_unit' => 'unidad', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=500&q=80',
                    ],
                    [
                        'name' => 'Pa Integral de Espelta',
                        'description' => 'Pa fet amb farina d\'espelta integral ecològica, alt contingut en fibra.',
                        'price' => 3.80, 'price_unit' => 'unidad', 'stock' => 20, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=500&q=80',
                    ],
                    [
                        'name' => 'Baguette Tradicional',
                        'description' => 'Baguette crujiente de elaboración diaria con harina local.',
                        'price' => 1.20, 'price_unit' => 'unidad', 'stock' => 60, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1608198399988-3e5c9bd1405e?w=500&q=80',
                    ],
                ],
                'Pastisseria' => [
                    [
                        'name' => 'Croissants de Mantequilla',
                        'description' => 'Croissants hojaldrados con mantequilla francesa, elaborados cada mañana.',
                        'price' => 1.80, 'price_unit' => 'unidad', 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1623334044303-241021148842?w=500&q=80',
                    ],
                    [
                        'name' => 'Ensaïmada Mallorquina',
                        'description' => 'Ensaïmada tradicional amb saïm de porc, recepta original de Mallorca.',
                        'price' => 3.50, 'price_unit' => 'unidad', 'stock' => 15, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1612203985729-70726954388c?w=500&q=80',
                    ],
                ],
                'Coca i salat' => [
                    [
                        'name' => 'Coca de Recapte',
                        'description' => 'Tradicional coca de recapte amb escalivada, tonyina i olives.',
                        'price' => 12.50, 'price_unit' => 'unidad', 'stock' => 10, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
                    ],
                    [
                        'name' => 'Coca de Llardons',
                        'description' => 'Coca dolça amb llardons i sucre, especialitat catalana de temporada.',
                        'price' => 8.00, 'price_unit' => 'unidad', 'stock' => 12, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80',
                    ],
                ],
            ],

            // ── Bodega Siurana ────────────────────────────────────────
            'Bodega Siurana' => [
                'Vins negres' => [
                    [
                        'name' => 'Garnatxa Negra Selecció',
                        'description' => 'Vi negre de Garnatxa del Priorat, criança de 12 mesos en bóta de roure.',
                        'price' => 18.00, 'price_unit' => 'botella', 'stock' => 48, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=500&q=80',
                    ],
                    [
                        'name' => 'Tempranillo Jove',
                        'description' => 'Vi negre jove de Tempranillo, fruitat i de fàcil beguda.',
                        'price' => 10.00, 'price_unit' => 'botella', 'stock' => 60, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1520859243805-f0c0e9c07b77?w=500&q=80',
                    ],
                ],
                'Vins blancs' => [
                    [
                        'name' => 'Macabeu Blanc Jove',
                        'description' => 'Vi blanc jove de Macabeu, fresc i aromàtic, perfecte per als aperitius.',
                        'price' => 12.00, 'price_unit' => 'botella', 'stock' => 36, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=500&q=80',
                    ],
                    [
                        'name' => 'Rosat de Garnatxa',
                        'description' => 'Vi rosat lleuger de Garnatxa, color salmó i pa llarg en boca.',
                        'price' => 11.00, 'price_unit' => 'botella', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1590691178821-5e09cd705b23?w=500&q=80',
                    ],
                ],
                'Caves i escumosos' => [
                    [
                        'name' => 'Cava Brut Nature',
                        'description' => 'Cava espumós elaborat pel mètode tradicional, sec i elegaant.',
                        'price' => 9.50, 'price_unit' => 'botella', 'stock' => 50, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1558346547-4439467bd1d5?w=500&q=80',
                    ],
                ],
            ],

            // ── Carnisseria Molins ────────────────────────────────────
            'Carnisseria Molins' => [
                'Vedella' => [
                    [
                        'name' => 'Chuleta de Ternera',
                        'description' => 'Chuleta de ternera de primera calidad, procedente de explotaciones locales sostenibles.',
                        'price' => 22.00, 'price_unit' => 'kg', 'stock' => 15, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&q=80',
                    ],
                    [
                        'name' => 'Filete de Ternera',
                        'description' => 'Filetes tiernos de la parte noble de la ternera, perfectos a la plancha.',
                        'price' => 28.00, 'price_unit' => 'kg', 'stock' => 10, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1588347818036-4c19c2f0e5e7?w=500&q=80',
                    ],
                ],
                'Porc' => [
                    [
                        'name' => 'Llom de Porc',
                        'description' => 'Llom de porc fresc de granja familiar, sense antibiòtics.',
                        'price' => 9.50, 'price_unit' => 'kg', 'stock' => 25, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=500&q=80',
                    ],
                    [
                        'name' => 'Botifarra Fresca',
                        'description' => 'Botifarra fresca artesana, elaborada amb carn de porc local i espècies naturals.',
                        'price' => 7.50, 'price_unit' => 'kg', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1612697997643-e5a1aaed852c?w=500&q=80',
                    ],
                ],
                'Aus' => [
                    [
                        'name' => 'Pollastre de Corral',
                        'description' => 'Pollastre de corral criat en llibertat a les granges del Segrià.',
                        'price' => 8.00, 'price_unit' => 'kg', 'stock' => 20, 'active' => true,
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
                        'price' => 18.00, 'price_unit' => 'ramo', 'stock' => 20, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&q=80',
                    ],
                    [
                        'name' => 'Bouquet de Primavera',
                        'description' => 'Bouquet de temporada amb espècies variades: tulipes, freèsies i gipsòfiles.',
                        'price' => 22.00, 'price_unit' => 'ramo', 'stock' => 15, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=500&q=80',
                    ],
                ],
                'Plantes' => [
                    [
                        'name' => 'Lavanda Ecològica',
                        'description' => 'Planta de lavanda ecològica en test de terrissa, ideal per a terrasses.',
                        'price' => 8.50, 'price_unit' => 'unidad', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=500&q=80',
                    ],
                    [
                        'name' => 'Romero Aromàtic',
                        'description' => 'Planta de romaní per cuinar i decorar, cultivada sense pesticides.',
                        'price' => 4.00, 'price_unit' => 'unidad', 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=500&q=80',
                    ],
                ],
                'Arranjaments' => [
                    [
                        'name' => 'Centre de Taula de Tardor',
                        'description' => 'Centre de taula artesà amb flors i branques seques de temporada.',
                        'price' => 35.00, 'price_unit' => 'unidad', 'stock' => 8, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=80',
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
                        'business_id' => $business->id,
                        'category_id' => $category->id,
                        'name' => $productData['name'],
                        'description' => $productData['description'],
                        'price' => $productData['price'],
                        'price_unit' => $productData['price_unit'] ?? 'unidad',
                        'stock' => $productData['stock'],
                        'active' => $productData['active'],
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
