<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Transportation',
                'color' => '#3B82F6',
                'icon' => 'plane',
                'is_default' => true,
            ],
            [
                'name' => 'Accommodation',
                'color' => '#10B981',
                'icon' => 'home',
                'is_default' => true,
            ],
            [
                'name' => 'Food & Dining',
                'color' => '#F59E0B',
                'icon' => 'utensils',
                'is_default' => true,
            ],
            [
                'name' => 'Activities',
                'color' => '#8B5CF6',
                'icon' => 'ticket',
                'is_default' => true,
            ],
            [
                'name' => 'Shopping',
                'color' => '#EC4899',
                'icon' => 'shopping-bag',
                'is_default' => true,
            ],
            [
                'name' => 'Health & Safety',
                'color' => '#EF4444',
                'icon' => 'heart',
                'is_default' => true,
            ],
            [
                'name' => 'Communication',
                'color' => '#06B6D4',
                'icon' => 'phone',
                'is_default' => true,
            ],
            [
                'name' => 'Miscellaneous',
                'color' => '#6B7280',
                'icon' => 'more-horizontal',
                'is_default' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name' => $category['name']],
                $category
            );
        }
    }
}
