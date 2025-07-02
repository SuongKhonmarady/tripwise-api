<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\TripParticipantController;
use App\Http\Controllers\Api\ItineraryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\TripMessageController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'googleAuth']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

// Categories (public access for better UX)
Route::get('/categories', [CategoryController::class, 'index']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    
    // Categories (authenticated CRUD operations)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::patch('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    
    // Trips
    Route::apiResource('trips', TripController::class);
    Route::get('/trips/{trip}/summary', [TripController::class, 'summary']);
    
    // Broadcasting authentication for Pusher/Echo
    Route::post('/broadcasting/auth', '\Illuminate\Broadcasting\BroadcastController@authenticate');
    
    // Pending invitations (special access)
    Route::get('/pending-invitations', [TripParticipantController::class, 'getPendingInvitations']);
    Route::get('/pending-invitations/{trip}', [TripParticipantController::class, 'getPendingInvitationTrip']);
    
    // Trip-specific routes
    Route::prefix('trips/{trip}')->group(function () {
        // Participants
        Route::get('/participants', [TripParticipantController::class, 'index']);
        Route::post('/participants', [TripParticipantController::class, 'store']);
        Route::put('/participants/{participant}', [TripParticipantController::class, 'update']);
        Route::delete('/participants/{participant}', [TripParticipantController::class, 'destroy']);
        Route::post('/participants/accept', [TripParticipantController::class, 'accept']);
        Route::post('/participants/decline', [TripParticipantController::class, 'decline']);
        
        // Itineraries
        Route::apiResource('itineraries', ItineraryController::class);
        
        // Expenses
        Route::apiResource('expenses', ExpenseController::class);
        Route::get('/expenses-summary', [ExpenseController::class, 'summary']);
        
        // Trip Chat Messages
        Route::get('/messages', [TripMessageController::class, 'index']);
        Route::get('/messages/last', [TripMessageController::class, 'lastMessage']);
        Route::post('/messages', [TripMessageController::class, 'store']);
        Route::post('/typing', [TripMessageController::class, 'typing']);
    });
});
