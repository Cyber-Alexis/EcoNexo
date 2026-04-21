<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * FIX: Eliminar cascadeOnDelete de category_id en products
     * para evitar que se borren productos al actualizar categorías del negocio.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Eliminar foreign key actual con cascade
            $table->dropForeign(['category_id']);
            
            // Recrear sin cascadeOnDelete (por defecto usa RESTRICT)
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('restrict'); // No permite eliminar categoría si tiene productos
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            
            // Restaurar el comportamiento original (cascade)
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->cascadeOnDelete();
        });
    }
};
