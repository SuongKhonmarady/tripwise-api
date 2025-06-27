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

    public function index(Trip $trip)
    {
        $this->authorize('view', $trip);
        return $trip->messages()->with('user:id,name')->latest()->take(50)->get()->reverse()->values();
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

        return response()->json(['status' => 'sent']);
    }

    public function typing(Request $request, Trip $trip)
    {
        $this->authorize('view', $trip);
        $user = $request->user();
        broadcast(new \App\Events\TripChatTyping($trip->id, $user))->toOthers();
        return response()->json(['status' => 'typing']);
    }
}
