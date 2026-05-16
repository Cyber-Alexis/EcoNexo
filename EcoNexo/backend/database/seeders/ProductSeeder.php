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
                        'img' => 'https://images.pexels.com/photos/7543135/pexels-photo-7543135.jpeg',
                    ],
                    [
                        'name' => 'Naranjas de Valencia',
                        'description' => 'Naranjas de Valencia importadas por temporada, jugosas y aromáticas.',
                        'price' => 2.20, 'price_unit' => 'kg', 'stock' => 80, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/10899685/pexels-photo-10899685.jpeg',
                    ],
                    [
                        'name' => 'Peras Conference',
                        'description' => 'Peras Conference de Lleida, la variedad más cultivada en la comarca.',
                        'price' => 2.50, 'price_unit' => 'kg', 'stock' => 60, 'active' => true,
                        'img' => 'https://s1.ppllstatics.com/diariovasco/www/multimedia/202004/28/media/cortadas/pera-conferencia-k4xE-U1001087821178CPH-1248x770@Diario%20Vasco.jpg',
                    ],
                ],
                'Verdures' => [
                    [
                        'name' => 'Tomates de Temporada',
                        'description' => 'Tomates rosa de temporada, carnosos y sin pesticidas.',
                        'price' => 3.50, 'price_unit' => 'kg', 'stock' => 70, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/32962425/pexels-photo-32962425.jpeg',
                    ],
                    [
                        'name' => 'Lechuga Ecológica',
                        'description' => 'Lechuga fresca de cultivo ecológico local, recogida esta mañana.',
                        'price' => 1.50, 'price_unit' => 'unidad', 'stock' => 50, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop',
                    ],
                    [
                        'name' => 'Espinacas Baby',
                        'description' => 'Espinacas baby tiernas, perfectas para ensaladas y salteados.',
                        'price' => 2.00, 'price_unit' => 'kg', 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop',
                    ],
                ],
                'Fruits secs' => [
                    [
                        'name' => 'Nueces del Bierzo',
                        'description' => 'Nueces frescas de temporada, ricas en omega-3.',
                        'price' => 6.50, 'price_unit' => 'kg', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/13819813/pexels-photo-13819813.jpeg',
                    ],
                    [
                        'name' => 'Almendras Marcona',
                        'description' => 'Almendras Marcona tostadas, la variedad española más apreciada.',
                        'price' => 9.00, 'price_unit' => 'kg', 'stock' => 25, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/7841139/pexels-photo-7841139.jpeg',
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
                        'img' => 'https://images.pexels.com/photos/36930978/pexels-photo-36930978.jpeg',
                    ],
                    [
                        'name' => 'Pa Integral de Espelta',
                        'description' => 'Pa fet amb farina d\'espelta integral ecològica, alt contingut en fibra.',
                        'price' => 3.80, 'price_unit' => 'unidad', 'stock' => 20, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&auto=format&fit=crop',
                    ],
                    [
                        'name' => 'Baguette Tradicional',
                        'description' => 'Baguette crujiente de elaboración diaria con harina local.',
                        'price' => 1.20, 'price_unit' => 'unidad', 'stock' => 60, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/3789032/pexels-photo-3789032.jpeg',
                    ],
                ],
                'Pastisseria' => [
                    [
                        'name' => 'Croissants de Mantequilla',
                        'description' => 'Croissants hojaldrados con mantequilla francesa, elaborados cada mañana.',
                        'price' => 1.80, 'price_unit' => 'unidad', 'stock' => 40, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop',
                    ],
                    [
                        'name' => 'Ensaïmada Mallorquina',
                        'description' => 'Ensaïmada tradicional amb saïm de porc, recepta original de Mallorca.',
                        'price' => 3.50, 'price_unit' => 'unidad', 'stock' => 15, 'active' => true,
                        'img' => 'https://imag.bonviveur.com/ensaimada-de-mallorca-casera.jpg', 
                    ],
                ],
                'Coca i salat' => [
                    [
                        'name' => 'Coca de Recapte',
                        'description' => 'Tradicional coca de recapte amb escalivada, tonyina i olives.',
                        'price' => 12.50, 'price_unit' => 'unidad', 'stock' => 10, 'active' => true,
                        'img' => 'https://media-cdn.tripadvisor.com/media/photo-s/15/10/7c/61/coca-de-recapte.jpg',
                    ],
                    [
                        'name' => 'Coca de Llardons',
                        'description' => 'Coca dolça amb llardons i sucre, especialitat catalana de temporada.',
                        'price' => 8.00, 'price_unit' => 'unidad', 'stock' => 12, 'active' => true,
                        'img' => 'https://assets.tmecosys.com/image/upload/t_web_rdp_recipe_584x480/img/recipe/ras/Assets/61CD01CE-8A35-4FF6-A670-D7D17EFD75B0/Derivates/2458d2b0-4287-45f3-bfed-1abb7a200377.jpg',
                    ],
                ],
            ],

            // ── Bodega Siurana ────────────────────────────────────────
            'Bodega Siurana' => [
                'Vins negres' => [
                    [
                        'name' => 'Garnatxa Negra Selecció',
                        'description' => 'Vi negre de Garnatxa del Priorat, criança de 12 mesos en bóta de roure.',
                        'price' => 18.00, 'price_unit' => 'unidad', 'stock' => 48, 'active' => true,
                        'img' => 'https://admin.artevino.es/multimedia/images/image_926.jpg',
                    ],
                    [
                        'name' => 'Tempranillo Jove',
                        'description' => 'Vi negre jove de Tempranillo, fruitat i de fàcil beguda.',
                        'price' => 10.00, 'price_unit' => 'unidad', 'stock' => 60, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/20874532/pexels-photo-20874532.jpeg',
                    ],
                ],
                'Vins blancs' => [
                    [
                        'name' => 'Macabeu Blanc Jove',
                        'description' => 'Vi blanc jove de Macabeu, fresc i aromàtic, perfecte per als aperitius.',
                        'price' => 12.00, 'price_unit' => 'unidad', 'stock' => 36, 'active' => true,
                        'img' => 'https://m.media-amazon.com/images/I/61Cbb0k+gcL.jpg',
                    ],
                    [
                        'name' => 'Rosat de Garnatxa',
                        'description' => 'Vi rosat lleuger de Garnatxa, color salmó i pa llarg en boca.',
                        'price' => 11.00, 'price_unit' => 'unidad', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/10045953/pexels-photo-10045953.jpeg',
                    ],
                ],
                'Caves i escumosos' => [
                    [
                        'name' => 'Cava Brut Nature',
                        'description' => 'Cava espumós elaborat pel mètode tradicional, sec i elegaant.',
                        'price' => 9.50, 'price_unit' => 'unidad', 'stock' => 50, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/29463857/pexels-photo-29463857.jpeg',
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
                        'img' => 'https://images.pexels.com/photos/31732110/pexels-photo-31732110.jpeg',
                    ],
                    [
                        'name' => 'Filete de Ternera',
                        'description' => 'Filetes tiernos de la parte noble de la ternera, perfectos a la plancha.',
                        'price' => 28.00, 'price_unit' => 'kg', 'stock' => 10, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/20187067/pexels-photo-20187067.jpeg',
                    ],
                ],
                'Porc' => [
                    [
                        'name' => 'Llom de Porc',
                        'description' => 'Llom de porc fresc de granja familiar, sense antibiòtics.',
                        'price' => 9.50, 'price_unit' => 'kg', 'stock' => 25, 'active' => true,
                        'img' => 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800&auto=format&fit=crop',
                    ],
                    [
                        'name' => 'Botifarra Fresca',
                        'description' => 'Botifarra fresca artesana, elaborada amb carn de porc local i espècies naturals.',
                        'price' => 7.50, 'price_unit' => 'kg', 'stock' => 30, 'active' => true,
                        'img' => 'https://delicatessen-juantxo.com/171-large_default/butifarra-fresca.jpg',
                    ],
                ],
                'Aus' => [
                    [
                        'name' => 'Pollastre de Corral',
                        'description' => 'Pollastre de corral criat en llibertat a les granges del Segrià.',
                        'price' => 8.00, 'price_unit' => 'kg', 'stock' => 20, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/8251004/pexels-photo-8251004.jpeg',
                    ],
                ],
            ],

            // ── Floristeria Natura ────────────────────────────────────
            'Floristeria Natura' => [
                'Rams i bouquets' => [
                    [
                        'name' => 'Ram de Roses Roges',
                        'description' => 'Ram de 12 roses roges fresques de temporada, collides avui.',
                        'price' => 18.00, 'price_unit' => 'unidad', 'stock' => 20, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/18566002/pexels-photo-18566002.jpeg',
                    ],
                    [
                        'name' => 'Bouquet de Primavera',
                        'description' => 'Bouquet de temporada amb espècies variades: tulipes, freèsies i gipsòfiles.',
                        'price' => 22.00, 'price_unit' => 'unidad', 'stock' => 15, 'active' => true,
                        'img' => 'https://www.viserchi.com/1327-large_default/bouquet-primaveraverano-.jpg',
                    ],
                ],
                'Plantes' => [
                    [
                        'name' => 'Lavanda Ecològica',
                        'description' => 'Planta de lavanda ecològica en test de terrissa, ideal per a terrasses.',
                        'price' => 8.50, 'price_unit' => 'unidad', 'stock' => 30, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/29158679/pexels-photo-29158679.jpeg',
                    ],
                    [
                        'name' => 'Romero Aromàtic',
                        'description' => 'Planta de romaní per cuinar i decorar, cultivada sense pesticides.',
                        'price' => 4.00, 'price_unit' => 'unidad', 'stock' => 40, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/5781237/pexels-photo-5781237.jpeg',
                    ],
                ],
                'Arranjaments' => [
                    [
                        'name' => 'Centre de Taula de Tardor',
                        'description' => 'Centre de taula artesà amb flors i branques seques de temporada.',
                        'price' => 35.00, 'price_unit' => 'unidad', 'stock' => 8, 'active' => true,
                        'img' => 'https://images.pexels.com/photos/5848146/pexels-photo-5848146.jpeg',
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
