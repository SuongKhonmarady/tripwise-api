<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TripFactory extends Factory
{
    public function definition()
    {
        return [
            'name' => $this->faker->sentence(3),
            'description' => $this->faker->paragraph(),
            'destination' => $this->faker->city(),
            'start_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+2 months'),
            'budget' => $this->faker->randomFloat(2, 100, 10000),
            'currency' => 'USD',
            'status' => 'planned',
            'user_id' => User::factory(),
        ];
    }
}
