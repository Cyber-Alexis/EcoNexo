<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Business;
use App\Models\User;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('contact_person_name')->nullable()->after('phone');
        });

        // Poblar negocios existentes con nombre del propietario
        Business::chunk(100, function ($businesses) {
            foreach ($businesses as $business) {
                // Buscar primer usuario asociado al negocio
                $owner = User::where('business_id', $business->id)
                    ->where('role', 'business')
                    ->first();

                if ($owner) {
                    $business->contact_person_name = trim($owner->name . ' ' . $owner->last_name);
                    $business->save();
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('contact_person_name');
        });
    }
};
