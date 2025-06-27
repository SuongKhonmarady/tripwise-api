<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\TripParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TripParticipantController extends Controller
{
    /**
     * Get all participants for a trip
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

        // If user has pending invitation, they can only see their own participant record
        $userParticipant = TripParticipant::where('trip_id', $trip->id)
            ->where('user_id', $user->id)
            ->first();
        if ($userParticipant && $userParticipant->status === 'pending') {
            return response()->json([
                'participants' => [$userParticipant->load('user:id,name,email')],
                'message' => 'Please accept your invitation to see all participants'
            ]);
        }

        // Full access for trip owner and accepted participants
        $participants = TripParticipant::where('trip_id', $trip->id)
            ->with('user:id,name,email')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'participants' => $participants
        ]);
    }

    /**
     * Invite a user to a trip
     */
    public function store(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        // Check if user can manage participants (owner or organizer)
        if (!$this->userCanManageParticipants($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'role' => 'required|in:organizer,participant,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find the user by email
        $invitedUser = User::where('email', $request->email)->first();
        
        if (!$invitedUser) {
            return response()->json([
                'message' => 'User not found with this email address'
            ], 404);
        }

        // Check if user is already a participant
        $existingParticipant = $trip->participants()
            ->where('user_id', $invitedUser->id)
            ->first();

        if ($existingParticipant) {
            return response()->json([
                'message' => 'User is already a participant of this trip'
            ], 409);
        }

        // Create the participant invitation
        $participant = TripParticipant::create([
            'trip_id' => $trip->id,
            'user_id' => $invitedUser->id,
            'role' => $request->role,
            'status' => 'pending',
            'invited_at' => now(),
        ]);

        $participant->load('user:id,name,email');

        return response()->json([
            'message' => 'User invited successfully',
            'participant' => $participant
        ], 201);
    }

    /**
     * Update participant role or status
     */
    public function update(Request $request, Trip $trip, TripParticipant $participant): JsonResponse
    {
        $user = $request->user();

        // Check if the participant belongs to this trip
        if ($participant->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Participant not found for this trip'
            ], 404);
        }

        // Allow users to update their own status (accept/decline invitation)
        // Or allow trip managers to update role
        $canUpdateStatus = $participant->user_id === $user->id;
        $canUpdateRole = $this->userCanManageParticipants($user, $trip);

        if (!$canUpdateStatus && !$canUpdateRole) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'sometimes|in:organizer,participant,viewer',
            'status' => 'sometimes|in:pending,accepted,declined',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = [];

        // Only allow status updates if user is updating their own participation
        if ($canUpdateStatus && $request->has('status')) {
            $updateData['status'] = $request->status;
            if ($request->status === 'accepted') {
                $updateData['joined_at'] = now();
            }
        }

        // Only allow role updates if user can manage participants
        if ($canUpdateRole && $request->has('role')) {
            // Prevent removing the last organizer
            if ($participant->role === 'organizer' && $request->role !== 'organizer') {
                $organizerCount = $trip->participants()
                    ->where('role', 'organizer')
                    ->where('status', 'accepted')
                    ->count();
                
                if ($organizerCount <= 1) {
                    return response()->json([
                        'message' => 'Cannot remove the last organizer from the trip'
                    ], 422);
                }
            }
            
            $updateData['role'] = $request->role;
        }

        $participant->update($updateData);
        $participant->load('user:id,name,email');

        return response()->json([
            'message' => 'Participant updated successfully',
            'participant' => $participant
        ]);
    }

    /**
     * Remove a participant from a trip
     */
    public function destroy(Request $request, Trip $trip, TripParticipant $participant): JsonResponse
    {
        $user = $request->user();

        // Check if the participant belongs to this trip
        if ($participant->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Participant not found for this trip'
            ], 404);
        }

        // Allow users to remove themselves or trip managers to remove others
        $canRemoveSelf = $participant->user_id === $user->id;
        $canRemoveOthers = $this->userCanManageParticipants($user, $trip);

        if (!$canRemoveSelf && !$canRemoveOthers) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Prevent removing the last organizer
        if ($participant->role === 'organizer') {
            $organizerCount = $trip->participants()
                ->where('role', 'organizer')
                ->where('status', 'accepted')
                ->count();
            
            if ($organizerCount <= 1) {
                return response()->json([
                    'message' => 'Cannot remove the last organizer from the trip'
                ], 422);
            }
        }

        $participant->delete();

        return response()->json([
            'message' => 'Participant removed successfully'
        ]);
    }

    /**
     * Accept an invitation to join a trip
     */
    public function accept(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        $participant = $trip->participants()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$participant) {
            return response()->json([
                'message' => 'No pending invitation found for this trip'
            ], 404);
        }

        $participant->update([
            'status' => 'accepted',
            'joined_at' => now(),
        ]);

        $participant->load('user:id,name,email');

        return response()->json([
            'message' => 'Invitation accepted successfully',
            'participant' => $participant
        ]);
    }

    /**
     * Decline an invitation to join a trip
     */
    public function decline(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        $participant = $trip->participants()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$participant) {
            return response()->json([
                'message' => 'No pending invitation found for this trip'
            ], 404);
        }

        $participant->update([
            'status' => 'declined',
        ]);

        return response()->json([
            'message' => 'Invitation declined successfully'
        ]);
    }

    /**
     * Get pending invitations for current user
     */
    public function getPendingInvitations(Request $request): JsonResponse
    {
        $user = $request->user();

        $pendingInvitations = TripParticipant::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with(['trip', 'user:id,name,email'])
            ->get();

        return response()->json([
            'invitations' => $pendingInvitations
        ]);
    }

    /**
     * Get trip details for pending invitation (limited info)
     */
    public function getPendingInvitationTrip(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        // Check if user has pending invitation for this trip
        $pendingInvitation = $trip->participants()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (!$pendingInvitation) {
            return response()->json([
                'message' => 'No pending invitation found for this trip'
            ], 404);
        }

        // Return only basic trip info and the user's invitation
        return response()->json([
            'trip' => [
                'id' => $trip->id,
                'name' => $trip->name,
                'description' => $trip->description,
                'destination' => $trip->destination,
                'start_date' => $trip->start_date,
                'end_date' => $trip->end_date,
                'budget' => $trip->budget,
                'currency' => $trip->currency,
            ],
            'invitation' => $pendingInvitation->load('user:id,name,email')
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
     * Check if user can manage participants
     */
    private function userCanManageParticipants($user, $trip): bool
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
