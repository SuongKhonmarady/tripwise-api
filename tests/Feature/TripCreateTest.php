<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class TripCreateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_trip()
    {
        $user = User::factory()->create([
            'email' => 'rady2@gmail.com',
            'password' => Hash::make('password'),
        ]);
        Sanctum::actingAs($user);

        $payload = [
            'name' => 'Trip to Paris',
            'description' => 'Vacation',
            'destination' => 'Paris',
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'budget' => 1000,
            'currency' => 'USD',
        ];

        $response = $this->postJson('/api/trips', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'trip' => [
                    'id',
                    'name',
                    'description',
                    'destination',
                    'start_date',
                    'end_date',
                    'budget',
                    'currency',
                    'status',
                    'user_id',
                ]
            ]);
    }
}
