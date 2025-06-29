<?php

namespace App\Http\Controllers\Api;

use App\Events\NewTripMessage;
use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripMessage;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class TripMessageController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request, Trip $trip)
    {
        $this->authorize('view', $trip);

        $limit = (int) $request->query('limit', 5);
        $beforeId = $request->query('before_id');

        $query = $trip->messages()->with('user:id,name')->latest();
        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }
        $messages = $query->take($limit)->get()->reverse()->values();
        return response()->json($messages);
    }

    /**
     * Get the last message in a group chat (trip)
     */
    public function lastMessage(Trip $trip)
    {
        $this->authorize('view', $trip);
        $message = $trip->messages()->with('user:id,name')->latest()->first();
        return response()->json($message);
    }

    public function store(Request $request, Trip $trip)
    {
        $this->authorize('view', $trip);

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = $trip->messages()->create([
            'user_id' => auth()->id(),
            'message' => $validated['message'],
        ]);

        $message->load('user:id,name');
        broadcast(new NewTripMessage($message))->toOthers();

        return response()->json($message, 201);
    }

    public function typing(Request $request, Trip $trip)
    {
        $this->authorize('view', $trip);
        $user = $request->user();
        broadcast(new \App\Events\TripChatTyping($trip->id, $user))->toOthers();
        return response()->json($message, 201);
    }
}
