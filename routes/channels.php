<?php
// routes/channels.php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('trip-chat.{tripId}', function ($user, $tripId) {
    return true;
});