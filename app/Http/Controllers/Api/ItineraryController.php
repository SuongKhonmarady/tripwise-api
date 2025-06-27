<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Itinerary;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ItineraryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        // Check if user has access to this trip
        if (!$this->userCanAccessTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $itineraries = $trip->itineraries()
            ->with('user')
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        return response()->json([
            'itineraries' => $itineraries
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'date' => 'required|date',
            'time' => 'nullable|date_format:H:i', // Time in HH:MM format
            'type' => 'required|in:flight,hotel,meal,activity,transport,meeting',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $itinerary = $trip->itineraries()->create([
            'title' => $request->title,
            'notes' => $request->notes,
            'location' => $request->location,
            'date' => $request->date,
            'time' => $request->time,
            'type' => $request->type,
            'user_id' => $user->id,
        ]);

        $itinerary->load('user');

        return response()->json([
            'message' => 'Itinerary item created successfully',
            'itinerary' => $itinerary
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Trip $trip, Itinerary $itinerary): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip) || $itinerary->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $itinerary->load('user');

        return response()->json([
            'itinerary' => $itinerary
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Trip $trip, Itinerary $itinerary): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip) || $itinerary->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'notes' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'date' => 'sometimes|required|date',
            'time' => 'nullable|date_format:H:i',
            'type' => 'sometimes|required|in:flight,hotel,meal,activity,transport,meeting',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $itinerary->update($request->only([
            'title', 'notes', 'location', 'date', 'time', 'type'
        ]));

        $itinerary->load('user');

        return response()->json([
            'message' => 'Itinerary item updated successfully',
            'itinerary' => $itinerary
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Trip $trip, Itinerary $itinerary): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip) || $itinerary->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Only creator or trip organizer can delete
        if ($itinerary->user_id !== $user->id && !$this->userCanEditTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $itinerary->delete();

        return response()->json([
            'message' => 'Itinerary item deleted successfully'
        ]);
    }

    /**
     * Check if user can access trip
     */
    private function userCanAccessTrip($user, $trip): bool
    {
        return $trip->user_id === $user->id || 
               $trip->participants()->where('user_id', $user->id)
                    ->where('status', 'accepted')->exists();
    }

    /**
     * Check if user can edit trip
     */
    private function userCanEditTrip($user, $trip): bool
    {
        if ($trip->user_id === $user->id) {
            return true;
        }

        $participant = $trip->participants()
            ->where('user_id', $user->id)
            ->where('status', 'accepted')
            ->first();

        return $participant && $participant->role === 'organizer';
    }
}
