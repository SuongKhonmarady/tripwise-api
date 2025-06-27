<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            // Add new fields expected by the controller
            $table->string('title')->after('user_id')->nullable();
            $table->datetime('expense_date')->after('date')->nullable();
            $table->foreignId('category_id')->after('category')->nullable()->constrained('categories');
            $table->string('receipt_url')->after('receipt_path')->nullable();
            $table->enum('split_type', ['equal', 'custom', 'percentage'])->after('split_between')->nullable();
            $table->json('split_data')->after('split_type')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->after('split_data')->default('approved');
            
            // Rename fields
            $table->renameColumn('split_between', 'split_between_old');
            $table->renameColumn('receipt_path', 'receipt_path_old');
        });
        
        // Copy data to new fields
        DB::statement('UPDATE expenses SET expense_date = date WHERE expense_date IS NULL');
        DB::statement('UPDATE expenses SET title = description WHERE title IS NULL');
        
        Schema::table('expenses', function (Blueprint $table) {
            // Drop old fields after copying data
            $table->dropColumn(['split_between_old', 'receipt_path_old', 'category']);
            
            // Make expense_date not nullable
            $table->datetime('expense_date')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            // Restore old structure
            $table->dropForeign(['category_id']);
            $table->dropColumn([
                'title', 
                'expense_date', 
                'category_id', 
                'receipt_url', 
                'split_type', 
                'split_data', 
                'status'
            ]);
            
            $table->string('category')->after('amount');
            $table->json('split_between')->after('is_shared')->nullable();
            $table->string('receipt_path')->after('split_between')->nullable();
        });
    }
};
