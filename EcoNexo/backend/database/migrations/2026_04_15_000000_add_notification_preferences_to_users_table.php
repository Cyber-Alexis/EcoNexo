<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notif_order_updates')->default(true)->after('postal_code');
            $table->boolean('notif_promotions')->default(false)->after('notif_order_updates');
            $table->boolean('notif_new_products')->default(true)->after('notif_promotions');
            $table->boolean('notif_review_responses')->default(true)->after('notif_new_products');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'notif_order_updates',
                'notif_promotions',
                'notif_new_products',
                'notif_review_responses',
            ]);
        });
    }
};
