<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
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

        $expenses = $trip->expenses()
            ->with(['user', 'category'])
            ->orderBy('expense_date', 'desc')
            ->get();

        return response()->json([
            'expenses' => $expenses
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
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'expense_date' => 'required|date',
            'category_id' => 'required|exists:categories,id',
            'is_shared' => 'boolean',
            'split_type' => 'nullable|in:equal,custom,percentage',
            'split_data' => 'nullable|array',
            'receipt_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $expense = $trip->expenses()->create([
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'currency' => $request->currency ?? $trip->currency ?? 'USD',
            'expense_date' => $request->expense_date,
            'category_id' => $request->category_id,
            'is_shared' => $request->is_shared ?? false,
            'split_type' => $request->split_type,
            'split_data' => $request->split_data,
            'receipt_url' => $request->receipt_url,
            'status' => 'approved',
            'user_id' => $user->id,
        ]);

        $expense->load(['user', 'category']);

        return response()->json([
            'message' => 'Expense created successfully',
            'expense' => $expense
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Trip $trip, Expense $expense): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip) || $expense->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $expense->load(['user', 'category']);

        return response()->json([
            'expense' => $expense
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Trip $trip, Expense $expense): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip) || $expense->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Only creator or trip organizer can edit
        if ($expense->user_id !== $user->id && !$this->userCanEditTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'sometimes|required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'expense_date' => 'sometimes|required|date',
            'category_id' => 'sometimes|required|exists:categories,id',
            'is_shared' => 'boolean',
            'split_type' => 'nullable|in:equal,custom,percentage',
            'split_data' => 'nullable|array',
            'receipt_url' => 'nullable|url',
            'status' => 'sometimes|in:pending,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $expense->update($request->only([
            'title', 'description', 'amount', 'currency', 'expense_date',
            'category_id', 'is_shared', 'split_type', 'split_data', 
            'receipt_url', 'status'
        ]));

        $expense->load(['user', 'category']);

        return response()->json([
            'message' => 'Expense updated successfully',
            'expense' => $expense
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Trip $trip, Expense $expense): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip) || $expense->trip_id !== $trip->id) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Only creator or trip organizer can delete
        if ($expense->user_id !== $user->id && !$this->userCanEditTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully'
        ]);
    }

    /**
     * Get expense summary for a trip
     */
    public function summary(Request $request, Trip $trip): JsonResponse
    {
        $user = $request->user();

        if (!$this->userCanAccessTrip($user, $trip)) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $expenses = $trip->expenses()->with('category')->get();
        
        $summary = [
            'total_expenses' => $expenses->sum('amount'),
            'budget_remaining' => $trip->budget - $expenses->sum('amount'),
            'expense_count' => $expenses->count(),
            'by_category' => $expenses->groupBy('category.name')->map(function ($categoryExpenses) {
                return [
                    'total' => $categoryExpenses->sum('amount'),
                    'count' => $categoryExpenses->count(),
                ];
            }),
            'by_user' => $expenses->groupBy('user.name')->map(function ($userExpenses) {
                return [
                    'total' => $userExpenses->sum('amount'),
                    'count' => $userExpenses->count(),
                ];
            }),
            'recent_expenses' => $expenses->take(10),
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
