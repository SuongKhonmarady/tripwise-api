<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Models\TripMessage;

class NewTripMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public TripMessage $message;

    public function __construct(TripMessage $message)
    {
        $this->message = $message;

        Log::info('🚀 NewTripMessage event created', [
            'message_id' => $message->id,
            'trip_id' => $message->trip_id,
            'channel' => 'trip-chat.' . $message->trip_id,
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\PrivateChannel
     */
    public function broadcastOn(): PrivateChannel
    {
        $channel = 'trip-chat.' . $this->message->trip_id;
        Log::info('📡 Broadcasting on channel: ' . $channel);
        return new PrivateChannel($channel);
    }

    /**
     * Data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        $data = [
            'id' => $this->message->id,
            'user' => $this->message->user->only(['id', 'name']),
            'message' => $this->message->message,
            'created_at' => $this->message->created_at->toDateTimeString(),
        ];

        Log::info('📦 Broadcasting data:', $data);
        return $data;
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        Log::info('🎯 Broadcasting as: new-message');
        return 'new-message';
    }
}
