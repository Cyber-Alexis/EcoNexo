<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Cal Pep' => [
                ['name' => 'Frutas',   'description' => 'Fruites fresques de temporada i de proximitat'],
                ['name' => 'Verdures', 'description' => 'Verdures ecològiques i de productors locals'],
                ['name' => 'Fruits secs', 'description' => 'Nous, ametlles, avellanes i fruits secs artesans'],
            ],
            'Forn de la Plaça' => [
                ['name' => 'Pa artesà',   'description' => 'Pans de massa mare i cereals integrals'],
                ['name' => 'Pastisseria', 'description' => 'Dolços, croissants i pastissos de temporada'],
                ['name' => 'Coca i salat', 'description' => 'Coques, pizzes i productes salats del forn'],
            ],
            'Bodega Siurana' => [
                ['name' => 'Vins negres', 'description' => 'Vins negres del Priorat i Terra Alta'],
                ['name' => 'Vins blancs', 'description' => 'Vins blancs i rosats lleugers'],
                ['name' => 'Caves i escumosos', 'description' => 'Caves brut nature i escumosos artesans'],
            ],
            'Carnisseria Molins' => [
                ['name' => 'Vedella',  'description' => 'Carn de vedella fresca de granja local'],
                ['name' => 'Porc',     'description' => 'Productes del porc i embotits artesans'],
                ['name' => 'Aus',      'description' => 'Pollastre, conill i aus de corral'],
            ],
            'Floristeria Natura' => [
                ['name' => 'Rams i bouquets', 'description' => 'Rams de flors fresques de temporada'],
                ['name' => 'Plantes', 'description' => 'Plantes d\'interior i exterior'],
                ['name' => 'Arranjaments', 'description' => 'Centres de taula i decoració floral artesana'],
            ],
        ];

        foreach ($data as $businessName => $categories) {
            $business = Business::where('name', $businessName)->firstOrFail();
            foreach ($categories as $cat) {
                Category::create([
                    'business_id' => $business->id,
                    'name'        => $cat['name'],
                    'description' => $cat['description'],
                ]);
            }
        }
    }
}
