<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('business_reviews', function (Blueprint $table) {
            $table->unique(['user_id', 'business_id'], 'unique_user_business_review');
        });

        Schema::table('product_reviews', function (Blueprint $table) {
            $table->unique(['user_id', 'product_id'], 'unique_user_product_review');
        });
    }

    public function down(): void
    {
        Schema::table('business_reviews', function (Blueprint $table) {
            $table->dropUnique('unique_user_business_review');
        });

        Schema::table('product_reviews', function (Blueprint $table) {
            $table->dropUnique('unique_user_product_review');
        });
    }
};
