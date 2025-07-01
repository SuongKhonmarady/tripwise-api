<?php
// routes/channels.php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\Trip;

Broadcast::channel('trip-chat.{tripId}', function ($user, $tripId) {
    // Check if user has access to this trip
    $trip = Trip::find($tripId);
    if (!$trip) {
        return false;
    }
    
    // Check if user is the owner or a participant of the trip
    return $trip->user_id === $user->id || $trip->participants()->where('user_id', $user->id)->exists();
});