<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ── Business users (referenced by BusinessSeeder) ──────────
        $businessUsers = [
            [
                'name'      => 'Pere',
                'last_name' => 'Garcia',
                'email'     => 'pere@calpep.com',
                'phone'     => '973100001',
                'role'      => 'business',
                'status'    => 'activo',
                'address'   => 'Carrer Major, 12',
                'city'      => 'Lleida',
                'postal_code' => '25001',
                'password'  => Hash::make('password'),
            ],
            [
                'name'      => 'Rosa',
                'last_name' => 'Martí',
                'email'     => 'rosa@forndelaplaca.com',
                'phone'     => '973100002',
                'role'      => 'business',
                'status'    => 'activo',
                'address'   => 'Carrer Sant Martí, 5',
                'city'      => 'Lleida',
                'postal_code' => '25002',
                'password'  => Hash::make('password'),
            ],
            [
                'name'      => 'Miquel',
                'last_name' => 'Ferrer',
                'email'     => 'miquel@bodegasiurana.com',
                'phone'     => '973100003',
                'role'      => 'business',
                'status'    => 'activo',
                'address'   => 'Plaça del Mercat, 3',
                'city'      => 'Lleida',
                'postal_code' => '25003',
                'password'  => Hash::make('password'),
            ],
            [
                'name'      => 'Anna',
                'last_name' => 'Molins',
                'email'     => 'anna@carnisseriamolins.com',
                'phone'     => '973100004',
                'role'      => 'business',
                'status'    => 'activo',
                'address'   => 'Carrer de la Pau, 8',
                'city'      => 'Lleida',
                'postal_code' => '25004',
                'password'  => Hash::make('password'),
            ],
            [
                'name'      => 'Clara',
                'last_name' => 'Puig',
                'email'     => 'clara@floristeria.com',
                'phone'     => '973100005',
                'role'      => 'business',
                'status'    => 'activo',
                'address'   => 'Carrer Osca, 21',
                'city'      => 'Lleida',
                'postal_code' => '25005',
                'password'  => Hash::make('password'),
            ],
        ];

        foreach ($businessUsers as $userData) {
            User::firstOrCreate(['email' => $userData['email']], $userData);
        }

        // ── Consumer user for testing ──────────────────────────────
        User::firstOrCreate(
            ['email' => 'client@econexo.com'],
            [
                'name'      => 'Client',
                'last_name' => 'De Prova',
                'email'     => 'client@econexo.com',
                'phone'     => '973200001',
                'role'      => 'consumer',
                'status'    => 'activo',
                'address'   => 'Avinguda Catalunya, 10',
                'city'      => 'Lleida',
                'postal_code' => '25006',
                'password'  => Hash::make('password'),
            ]
        );

        // ── Admin user ─────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@econexo.com'],
            [
                'name'      => 'Admin',
                'last_name' => 'EcoNexo',
                'email'     => 'admin@econexo.com',
                'phone'     => '973000000',
                'role'      => 'admin',
                'status'    => 'activo',
                'address'   => 'Calle Admin, 1',
                'city'      => 'Madrid',
                'postal_code' => '28001',
                'password'  => Hash::make('password'),
            ]
        );
    }
}
