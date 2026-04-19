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
        Schema::table('images', function (Blueprint $table) {
            $table->integer('position')->default(0)->after('type');
            $table->index(['imageable_id', 'imageable_type', 'type', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropIndex(['imageable_id', 'imageable_type', 'type', 'position']);
            $table->dropColumn('position');
        });
    }
};
