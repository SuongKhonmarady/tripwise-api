<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    protected $fillable = [
        'trip_id',
        'user_id',
        'category_id',
        'title',
        'description',
        'amount',
        'currency',
        'expense_date',
        'receipt_url',
        'is_shared',
        'split_type',
        'split_data',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'datetime',
        'is_shared' => 'boolean',
        'split_data' => 'array',
    ];

    // Relationships
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // Helper methods
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function hasReceipt(): bool
    {
        return !empty($this->receipt_url);
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2) . ' ' . ($this->currency ?? 'USD');
    }

    public function getSplitAmountForUser($userId): float
    {
        if (!$this->is_shared || !$this->split_data) {
            return 0;
        }

        // Handle different split types
        switch ($this->split_type) {
            case 'equal':
                $participants = count($this->split_data['participants'] ?? []);
                return $participants > 0 ? $this->amount / $participants : 0;
            
            case 'custom':
                return $this->split_data['amounts'][$userId] ?? 0;
            
            case 'percentage':
                $percentage = $this->split_data['percentages'][$userId] ?? 0;
                return ($this->amount * $percentage) / 100;
            
            default:
                return 0;
        }
    }
}
