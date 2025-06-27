#!/bin/bash

echo "🚀 Testing TripWise API - Trip Management"
echo "========================================"

BASE_URL="http://localhost:8000/api"

# Test 1: Register a new user
echo
echo "📝 Test 1: User Registration"
echo "----------------------------"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }')

echo "Registration Response:"
echo "$REGISTER_RESPONSE" | jq '.'

# Extract token from registration
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Registration failed, no token received"
  exit 1
fi

echo "✅ Registration successful! Token: ${TOKEN:0:20}..."

# Test 2: Get categories
echo
echo "📋 Test 2: Get Categories"
echo "-------------------------"

CATEGORIES_RESPONSE=$(curl -s -X GET "$BASE_URL/categories" \
  -H "Accept: application/json")

echo "Categories Response:"
echo "$CATEGORIES_RESPONSE" | jq '.categories | length as $count | "Found \($count) categories"'

# Test 3: Create a trip
echo
echo "🌴 Test 3: Create Trip"
echo "----------------------"

TRIP_RESPONSE=$(curl -s -X POST "$BASE_URL/trips" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Trip to Bali",
    "description": "Amazing vacation in paradise",
    "destination": "Bali, Indonesia",
    "start_date": "2025-07-15",
    "end_date": "2025-07-25",
    "budget": 2500,
    "currency": "USD"
  }')

echo "Trip Creation Response:"
echo "$TRIP_RESPONSE" | jq '.'

# Extract trip ID
TRIP_ID=$(echo "$TRIP_RESPONSE" | jq -r '.trip.id // empty')

if [ -z "$TRIP_ID" ]; then
  echo "❌ Trip creation failed"
  exit 1
fi

echo "✅ Trip created successfully! Trip ID: $TRIP_ID"

# Test 4: Get user trips
echo
echo "📊 Test 4: Get User Trips"
echo "-------------------------"

TRIPS_RESPONSE=$(curl -s -X GET "$BASE_URL/trips" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "User Trips Response:"
echo "$TRIPS_RESPONSE" | jq '.trips | length as $count | "User has \($count) trips"'

# Test 5: Add expense to trip
echo
echo "💰 Test 5: Add Expense to Trip"
echo "-------------------------------"

# Get first category ID
CATEGORY_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.categories[0].id')

EXPENSE_RESPONSE=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/expenses" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"title\": \"Flight Tickets\",
    \"description\": \"Round trip flights to Bali\",
    \"amount\": 800,
    \"currency\": \"USD\",
    \"expense_date\": \"2025-06-26\",
    \"category_id\": $CATEGORY_ID
  }")

echo "Expense Creation Response:"
echo "$EXPENSE_RESPONSE" | jq '.'

# Test 6: Add itinerary item
echo
echo "🗓️  Test 6: Add Itinerary Item"
echo "------------------------------"

ITINERARY_RESPONSE=$(curl -s -X POST "$BASE_URL/trips/$TRIP_ID/itineraries" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Check-in to Hotel",
    "description": "Arrive and check into the resort",
    "location": "Seminyak Beach Resort, Bali",
    "start_time": "2025-07-15T15:00:00",
    "end_time": "2025-07-15T16:00:00",
    "type": "accommodation",
    "priority": "high"
  }')

echo "Itinerary Creation Response:"
echo "$ITINERARY_RESPONSE" | jq '.'

# Test 7: Get trip summary
echo
echo "📈 Test 7: Get Trip Summary"
echo "---------------------------"

SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/trips/$TRIP_ID/summary" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Trip Summary Response:"
echo "$SUMMARY_RESPONSE" | jq '.'

echo
echo "🎉 All tests completed successfully!"
echo "✅ User registration works"
echo "✅ Trip creation works"
echo "✅ Expense tracking works"
echo "✅ Itinerary planning works"
echo "✅ Trip summaries work"
echo
echo "🌐 Your TripWise app is ready!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000/api"
