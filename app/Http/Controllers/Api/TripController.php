<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripParticipant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TripController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Get trips where user is owner or accepted participant
        // Pending invitations are handled separately in the collaborative planning
        $trips = Trip::where('user_id', $user->id)
            ->orWhereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id)->where('status', 'accepted');
            })
            ->with(['participants.user', 'expenses', 'itineraries'])
            ->orderBy('start_date', 'desc')
            ->get();

        // Also get trips with pending invitations for collaborative planning only
        $pendingInvitations = Trip::whereHas('participants', function ($query) use ($user) {
            $query->where('user_id', $user->id)->where('status', 'pending');
        })
        ->with(['participants' => function ($query) use ($user) {
            $query->where('user_id', $user->id)->where('status', 'pending');
        }, 'participants.user'])
        ->get();

        return response()->json([
            'trips' => $trips,
            'pending_invitations' => $pendingInvitations
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'destination' => 'required|string|max:255',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'participants' => 'nullable|array',
            'participants.*' => 'email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $trip = Trip::create([
            'name' => $request->name,
            'description' => $request->description,
            'destination' => $request->destination,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'budget' => $request->budget,
            'currency' => $request->currency ?? 'USD',
            'status' => 'active',
            'user_id' => $request->user()->id,
        ]);

        // Add the creator as an organizer
        TripParticipant::create([
            'trip_id' => $trip->id,
            'user_id' => $request->user()->id,
            'role' => 'organizer',
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        // Invite participants by email if provided (like invite user flow)
        if ($request->has('participants')) {
            foreach ($request->participants as $email) {
                if (filter_var($email, FILTER_VALIDATE_EMAIL) && $email !== $request->user()->email) {
                    $user = \App\Models\User::where('email', $email)->first();
                    if ($user) {
                        // Check if already a participant
                        $existing = TripParticipant::where('trip_id', $trip->id)
                            ->where('user_id', $user->id)
                            ->first();
                        if (!$existing) {
                            TripParticipant::create([
                                'trip_id' => $trip->id,
                                'user_id' => $user->id,
                                'role' => 'participant',
                                'status' => 'pending',
                                'invited_at' => now(),
                            ]);
                        }
                    }
                    // Optionally, send invitation email if user not found
                }
            }
        }

        $trip->load(['participants', 'expenses', 'itineraries']);

        return response()->json([
            'message' => 'Trip created successfully',
            'trip' => $trip
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        // Check if user has access to this trip
        if (!$this->userCanAccessTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $trip->load(['participants', 'expenses.category', 'expenses.user', 'itineraries.user']);

        return response()->json([
            'trip' => $trip
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        // Check if user can edit this trip (owner or organizer)
        if (!$this->userCanEditTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'destination' => 'sometimes|required|string|max:255',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'budget' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'status' => 'sometimes|in:active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $trip->update($request->only([
            'name', 'description', 'destination', 'start_date', 
            'end_date', 'budget', 'currency', 'status'
        ]));

        $trip->load(['participants', 'expenses', 'itineraries']);

        return response()->json([
            'message' => 'Trip updated successfully',
            'trip' => $trip
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        // Only trip owner can delete
        if ($trip->user_id !== $user->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $trip->delete();

        return response()->json([
            'message' => 'Trip deleted successfully'
        ]);
    }

    /**
     * Get trip summary with statistics
     */
    public function summary(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $summary = [
            'trip' => $trip,
            'statistics' => [
                'duration' => $trip->duration,
                'total_expenses' => $trip->total_expenses,
                'remaining_budget' => $trip->remaining_budget,
                'participants_count' => $trip->participants()->where('status', 'accepted')->count(),
                'itineraries_count' => $trip->itineraries()->count(),
                'expenses_count' => $trip->expenses()->count(),
            ],
            'recent_activities' => [
                'expenses' => $trip->expenses()->with('user')->latest()->limit(5)->get(),
                'itineraries' => $trip->itineraries()->with('user')->latest()->limit(5)->get(),
            ]
        ];

        return response()->json($summary);
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
