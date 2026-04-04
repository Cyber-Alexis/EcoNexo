<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuario administrador por defecto
        User::firstOrCreate(
            ['email' => 'admin@econexo.com'],
            [
                'name' => 'Admin',
                'last_name' => 'Sistema',
                'email' => 'admin@econexo.com',
                'password' => bcrypt('AdminEcoNexo2024!'),
                'role' => 'admin',
                'status' => 'activo',
                'phone' => '+34 666 000 000',
                'address' => 'Calle Admin, 1',
                'city' => 'Madrid',
                'postal_code' => '28001',
            ]
        );
    }
}
