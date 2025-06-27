<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/debug-pusher', function () {
    return config('broadcasting.connections.pusher');
});
