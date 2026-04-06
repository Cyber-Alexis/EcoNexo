<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\BusinessReview;
use App\Models\User;
use Illuminate\Database\Seeder;

class BusinessReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get businesses
        $calPep = Business::whereHas('user', fn($q) => $q->where('email', 'pere@calpep.com'))->first();
        $fornPlaca = Business::whereHas('user', fn($q) => $q->where('email', 'rosa@forndelaplaca.com'))->first();
        $bodegaSiurana = Business::whereHas('user', fn($q) => $q->where('email', 'miquel@bodegasiurana.com'))->first();
        $carnisseriaMolins = Business::whereHas('user', fn($q) => $q->where('email', 'anna@carnisseriamolins.com'))->first();
        $floristeria = Business::whereHas('user', fn($q) => $q->where('email', 'clara@floristeria.com'))->first();

        // Reviews for Cal Pep (Fruiteria)
        if ($calPep) {
            BusinessReview::create([
                'business_id' => $calPep->id,
                'user_id' => User::where('email', 'maria.garcia@example.com')->first()->id,
                'rating' => 5,
                'comment' => 'Productos excelentes y muy frescos. Siempre compro aquí mis verduras.',
                'created_at' => now()->subDays(2),
            ]);

            BusinessReview::create([
                'business_id' => $calPep->id,
                'user_id' => User::where('email', 'joan.martinez@example.com')->first()->id,
                'rating' => 4,
                'comment' => '¡La mejor fruta de Lleida! Producto local de calidad y trato muy familiar.',
                'created_at' => now()->subDays(5),
            ]);

            BusinessReview::create([
                'business_id' => $calPep->id,
                'user_id' => User::where('email', 'laura.sanchez@example.com')->first()->id,
                'rating' => 3,
                'comment' => 'Buena calidad y precio justo. Recomendable para comprar producto fresco de proximidad, aunque a veces hay poca variedad.',
                'created_at' => now()->subDays(10),
            ]);
        }

        // Reviews for Forn de la Plaça (Bakery)
        if ($fornPlaca) {
            BusinessReview::create([
                'business_id' => $fornPlaca->id,
                'user_id' => User::where('email', 'pere.lopez@example.com')->first()->id,
                'rating' => 5,
                'comment' => 'El mejor pan artesano de la ciudad. ¡La masa madre es espectacular!',
                'created_at' => now()->subDays(1),
            ]);

            BusinessReview::create([
                'business_id' => $fornPlaca->id,
                'user_id' => User::where('email', 'anna.rodriguez@example.com')->first()->id,
                'rating' => 5,
                'comment' => 'Pan de calidad excepcional. Las cocas también están buenísimas. Totalmente recomendable.',
                'created_at' => now()->subDays(7),
            ]);

            BusinessReview::create([
                'business_id' => $fornPlaca->id,
                'user_id' => User::where('email', 'maria.garcia@example.com')->first()->id,
                'rating' => 4,
                'comment' => 'Muy buen horno con productos ecológicos. La única pega es que a veces hay cola.',
                'created_at' => now()->subDays(12),
            ]);
        }

        // Reviews for Bodega Siurana (Winery)
        if ($bodegaSiurana) {
            BusinessReview::create([
                'business_id' => $bodegaSiurana->id,
                'user_id' => User::where('email', 'carles.fernandez@example.com')->first()->id,
                'rating' => 5,
                'comment' => 'Vinos excepcionales del Priorat. El trato familiar y el conocimiento del producto son inmejorables.',
                'created_at' => now()->subDays(3),
            ]);

            BusinessReview::create([
                'business_id' => $bodegaSiurana->id,
                'user_id' => User::where('email', 'laura.sanchez@example.com')->first()->id,
                'rating' => 4,
                'comment' => 'Una experiencia única. Los cavas artesanos son de una calidad extraordinaria.',
                'created_at' => now()->subDays(8),
            ]);

            BusinessReview::create([
                'business_id' => $bodegaSiurana->id,
                'user_id' => User::where('email', 'joan.martinez@example.com')->first()->id,
                'rating' => 3,
                'comment' => 'Buenos vinos naturales con mucha personalidad. Precios un poco altos pero justificados por la calidad. El servicio podría ser más rápido.',
                'created_at' => now()->subDays(15),
            ]);
        }

        // Reviews for Carnisseria Molins (Butcher)
        if ($carnisseriaMolins) {
            BusinessReview::create([
                'business_id' => $carnisseriaMolins->id,
                'user_id' => User::where('email', 'anna.rodriguez@example.com')->first()->id,
                'rating' => 5,
                'comment' => 'Carne fresca de gran calidad. Se nota que es de granjas locales y sostenibles.',
                'created_at' => now()->subDays(4),
            ]);

            BusinessReview::create([
                'business_id' => $carnisseriaMolins->id,
                'user_id' => User::where('email', 'pere.lopez@example.com')->first()->id,
                'rating' => 4,
                'comment' => 'Muy buen producto y buen asesoramiento. La carne es siempre fresca y de proximidad.',
                'created_at' => now()->subDays(6),
            ]);

            BusinessReview::create([
                'business_id' => $carnisseriaMolins->id,
                'user_id' => User::where('email', 'carles.fernandez@example.com')->first()->id,
                'rating' => 3,
                'comment' => 'La mejor carnicería de Lleida en cuanto a producto local y de confianza. El precio es algo elevado comparado con otras opciones.',
                'created_at' => now()->subDays(11),
            ]);
        }

        // Reviews for Floristeria Natura (Florist)
        if ($floristeria) {
            BusinessReview::create([
                'business_id' => $floristeria->id,
                'user_id' => User::where('email', 'maria.garcia@example.com')->first()->id,
                'rating' => 5,
                'comment' => 'Flores preciosas y de temporada. Los arreglos artesanos son una auténtica obra de arte.',
                'created_at' => now()->subDays(1),
            ]);

            BusinessReview::create([
                'business_id' => $floristeria->id,
                'user_id' => User::where('email', 'laura.sanchez@example.com')->first()->id,
                'rating' => 4,
                'comment' => 'Floristería ecológica con flores que duran mucho más que las convencionales. ¡Muy recomendable!',
                'created_at' => now()->subDays(9),
            ]);

            BusinessReview::create([
                'business_id' => $floristeria->id,
                'user_id' => User::where('email', 'joan.martinez@example.com')->first()->id,
                'rating' => 3,
                'comment' => 'Buen servicio y productos de calidad. Las composiciones florales son muy bonitas, aunque los precios son un poco altos.',
                'created_at' => now()->subDays(14),
            ]);
        }
    }
}
