<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TripChatTyping implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $tripId;

    public function __construct($tripId, $user)
    {
        $this->tripId = $tripId;
        $this->user = $user;
        
        Log::info("TripChatTyping event created for user {$user->id} in trip {$tripId}");
    }

    public function broadcastOn()
    {
        return new PrivateChannel('trip-chat.' . $this->tripId);
    }

    public function broadcastAs()
    {
        return 'typing';
    }

    public function broadcastWith()
    {
        return [
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email ?? null,
            ],
            'trip_id' => $this->tripId,
            'timestamp' => now()->toISOString(),
        ];
    }
}
