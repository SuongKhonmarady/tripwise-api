<?php

echo "TripWise API Backend - Test Script\n";
echo "================================\n\n";

// Test database connection
try {
    require __DIR__ . '/vendor/autoload.php';
    
    $app = require_once __DIR__ . '/bootstrap/app.php';
    $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    
    // Test database connection
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=tripwise', 'root', '');
    echo "✓ Database connection successful\n";
    
    // Test categories exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM categories");
    $count = $stmt->fetchColumn();
    echo "✓ Found {$count} categories in database\n";
    
    // Test users table
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $userCount = $stmt->fetchColumn();
    echo "✓ Found {$userCount} users in database\n";
    
    // Test trips table
    $stmt = $pdo->query("SELECT COUNT(*) FROM trips");
    $tripCount = $stmt->fetchColumn();
    echo "✓ Found {$tripCount} trips in database\n";
    
    echo "\n✅ Backend setup complete and ready!\n";
    echo "\nAPI Base URL: http://localhost:8000/api\n";
    echo "Available endpoints:\n";
    echo "- POST /api/register - User registration\n";
    echo "- POST /api/login - User login\n";
    echo "- GET /api/user - Get user info (auth required)\n";
    echo "- GET /api/categories - Get expense categories\n";
    echo "- GET /api/trips - Get user trips (auth required)\n";
    echo "- POST /api/trips - Create new trip (auth required)\n";
    echo "- And many more...\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\nNext steps:\n";
echo "1. Start the Laravel server: php artisan serve\n";
echo "2. Connect the React frontend to this API\n";
echo "3. Test user registration and trip creation\n";
