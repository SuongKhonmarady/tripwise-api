<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Models\User;
use App\Models\TripMessage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;

class TripMessageTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Trip $trip;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test user and trip
        $this->user = User::factory()->create();
        $this->trip = Trip::factory()->create([
            'user_id' => $this->user->id
        ]);
    }

    public function test_can_post_message()
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/trips/' . $this->trip->id . '/messages', [
            'message' => 'Test message content'
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'message',
                    'user_id',
                    'trip_id',
                    'created_at',
                    'updated_at'
                ]
            ]);

        $this->assertDatabaseHas('trip_messages', [
            'message' => 'Test message content',
            'user_id' => $this->user->id,
            'trip_id' => $this->trip->id
        ]);
    }

    public function test_can_get_trip_messages()
    {
        Sanctum::actingAs($this->user);

        // Create some test messages
        TripMessage::factory()->count(3)->create([
            'trip_id' => $this->trip->id,
            'user_id' => $this->user->id
        ]);

        $response = $this->getJson('/api/trips/' . $this->trip->id . '/messages');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'message',
                        'user_id',
                        'trip_id',
                        'created_at',
                        'updated_at',
                        'user' => [
                            'id',
                            'name'
                        ]
                    ]
                ]
            ]);

        $this->assertCount(3, $response->json('data'));
    }
}
