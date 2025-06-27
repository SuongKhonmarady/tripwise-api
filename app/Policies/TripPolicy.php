<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;

class TripPolicy
{
    public function view(User $user, Trip $trip)
    {
        // Allow if user is owner
        if ($trip->user_id === $user->id) {
            return true;
        }
        // Allow if user is a participant (any status)
        return $trip->participants()->where('user_id', $user->id)->exists();
    }
}
