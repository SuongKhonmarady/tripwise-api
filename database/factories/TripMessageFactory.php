<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TripMessageFactory extends Factory
{
    public function definition()
    {
        return [
            'message' => $this->faker->sentence(),
            'trip_id' => Trip::factory(),
            'user_id' => User::factory(),
        ];
    }
}
