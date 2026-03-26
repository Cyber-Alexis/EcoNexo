<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use \Illuminate\Database\Console\Seeds\WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            UserSeeder::class,
            BusinessSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
