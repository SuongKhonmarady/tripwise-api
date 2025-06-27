# TripWise API Test Script
Write-Host "🚀 Testing TripWise API - Trip Management" -ForegroundColor Green
Write-Host "========================================"

$baseUrl = "http://localhost:8000/api"

try {
    # Test 1: Register a new user
    Write-Host "`n📝 Test 1: User Registration" -ForegroundColor Yellow
    Write-Host "----------------------------"

    $registerBody = @{
        name = "Test User"
        email = "testuser@example.com"
        password = "password123"
        password_confirmation = "password123"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Registration successful! User: $($registerResponse.user.name)" -ForegroundColor Green

    $token = $registerResponse.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Accept" = "application/json"
        "Content-Type" = "application/json"
    }

    # Test 2: Get categories
    Write-Host "`n📋 Test 2: Get Categories" -ForegroundColor Yellow
    Write-Host "-------------------------"

    $categoriesResponse = Invoke-RestMethod -Uri "$baseUrl/categories" -Method GET
    Write-Host "✅ Found $($categoriesResponse.categories.Count) categories" -ForegroundColor Green

    # Test 3: Create a trip
    Write-Host "`n🌴 Test 3: Create Trip" -ForegroundColor Yellow
    Write-Host "----------------------"

    $tripBody = @{
        name = "Test Trip to Bali"
        description = "Amazing vacation in paradise"
        destination = "Bali, Indonesia"
        start_date = "2025-07-15"
        end_date = "2025-07-25"
        budget = 2500
        currency = "USD"
    } | ConvertTo-Json

    $tripResponse = Invoke-RestMethod -Uri "$baseUrl/trips" -Method POST -Body $tripBody -Headers $headers
    Write-Host "✅ Trip created successfully! Trip: $($tripResponse.trip.name)" -ForegroundColor Green

    $tripId = $tripResponse.trip.id

    # Test 4: Get user trips
    Write-Host "`n📊 Test 4: Get User Trips" -ForegroundColor Yellow
    Write-Host "-------------------------"

    $tripsResponse = Invoke-RestMethod -Uri "$baseUrl/trips" -Method GET -Headers $headers
    Write-Host "✅ User has $($tripsResponse.trips.Count) trips" -ForegroundColor Green

    # Test 5: Add expense to trip
    Write-Host "`n💰 Test 5: Add Expense to Trip" -ForegroundColor Yellow
    Write-Host "-------------------------------"

    $categoryId = $categoriesResponse.categories[0].id
    $expenseBody = @{
        title = "Flight Tickets"
        description = "Round trip flights to Bali"
        amount = 800
        currency = "USD"
        expense_date = "2025-06-26"
        category_id = $categoryId
    } | ConvertTo-Json

    $expenseResponse = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/expenses" -Method POST -Body $expenseBody -Headers $headers
    Write-Host "✅ Expense added successfully! Amount: $($expenseResponse.expense.amount)" -ForegroundColor Green

    # Test 6: Add itinerary item
    Write-Host "`n🗓️  Test 6: Add Itinerary Item" -ForegroundColor Yellow
    Write-Host "------------------------------"

    $itineraryBody = @{
        title = "Check-in to Hotel"
        description = "Arrive and check into the resort"
        location = "Seminyak Beach Resort, Bali"
        start_time = "2025-07-15T15:00:00"
        end_time = "2025-07-15T16:00:00"
        type = "accommodation"
        priority = "high"
    } | ConvertTo-Json

    $itineraryResponse = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/itineraries" -Method POST -Body $itineraryBody -Headers $headers
    Write-Host "✅ Itinerary item added successfully! Activity: $($itineraryResponse.itinerary.title)" -ForegroundColor Green

    # Test 7: Get trip summary
    Write-Host "`n📈 Test 7: Get Trip Summary" -ForegroundColor Yellow
    Write-Host "---------------------------"

    $summaryResponse = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/summary" -Method GET -Headers $headers
    Write-Host "✅ Trip summary retrieved successfully!" -ForegroundColor Green
    Write-Host "   - Duration: $($summaryResponse.statistics.duration) days"
    Write-Host "   - Total Expenses: $($summaryResponse.statistics.total_expenses)"
    Write-Host "   - Remaining Budget: $($summaryResponse.statistics.remaining_budget)"
    Write-Host "   - Participants: $($summaryResponse.statistics.participants_count)"

    Write-Host "`n🎉 All tests completed successfully!" -ForegroundColor Green
    Write-Host "✅ User registration works" -ForegroundColor Green
    Write-Host "✅ Trip creation works" -ForegroundColor Green
    Write-Host "✅ Expense tracking works" -ForegroundColor Green
    Write-Host "✅ Itinerary planning works" -ForegroundColor Green
    Write-Host "✅ Trip summaries work" -ForegroundColor Green
    Write-Host "`n🌐 Your TripWise app is ready!" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "Backend API: http://localhost:8000/api" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}
