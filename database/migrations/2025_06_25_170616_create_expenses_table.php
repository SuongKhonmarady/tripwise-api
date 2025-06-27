<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained(); // Who paid for this expense
            $table->decimal('amount', 10, 2);
            $table->string('category');
            $table->text('description');
            $table->date('date');
            $table->string('currency', 3)->default('USD');
            $table->json('split_between')->nullable(); // Array of user IDs for expense splitting
            $table->boolean('is_shared')->default(false);
            $table->string('receipt_path')->nullable(); // For uploaded receipts
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
