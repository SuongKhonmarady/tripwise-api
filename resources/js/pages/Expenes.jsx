import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext'
import { useAuth } from '../context/AuthContext'
import { expensesService } from '../services/expensesService'
import participantsService from '../services/participantsService'
import { 
  DollarSign, 
  Plus, 
  Filter, 
  TrendingUp,
  PieChart,
  Edit,
  Trash2,
  Download,
  Users,
  Share2,
  Receipt
} from 'lucide-react'
import { format } from 'date-fns'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from 'recharts'

export default function ExpenseTracker() {
  const navigate = useNavigate()
  const { trips, categories } = useTrip()
  const { user: currentUser } = useAuth()
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('list') // 'list', 'charts'
  const [expenses, setExpenses] = useState([])
  const [participants, setParticipants] = useState([])
  const [allParticipants, setAllParticipants] = useState([]) // Store all participants to check roles
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [error, setError] = useState(null)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)

  useEffect(() => {
    if (selectedTrip) {
      loadExpenses()
      loadParticipants()
    }
  }, [selectedTrip])

  // Set initial selected trip when trips are loaded
  useEffect(() => {
    if (trips.length > 0 && !selectedTrip) {
      setSelectedTrip(trips[0])
    }
  }, [trips, selectedTrip])

  const loadParticipants = useCallback(async () => {
    if (!selectedTrip) return
    
    try {
      const result = await participantsService.getParticipants(selectedTrip.id)
      if (result.success) {
        console.log('Loaded participants:', result.data)
        // Store all participants for role checking
        setAllParticipants(result.data)
        // Only include accepted participants for expense splitting
        setParticipants(result.data.filter(p => p.status === 'accepted'))
      }
    } catch (err) {
      console.error('Error loading participants:', err)
      setParticipants([])
      setAllParticipants([])
    }
  }, [selectedTrip])

  const loadExpenses = useCallback(async () => {
    if (!selectedTrip) return
    
    try {
      setLoadingExpenses(true)
      setError(null)
      const data = await expensesService.getExpenses(selectedTrip.id)
      setExpenses(data)
    } catch (err) {
      console.error('Error loading expenses:', err)
      setError('Failed to load expenses')
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }, [selectedTrip])

  // Check if current user can add expenses (is organizer or participant)
  const canAddExpenses = useCallback(() => {
    if (!currentUser || !selectedTrip || !allParticipants.length) {
      return false
    }
    
    const userParticipant = allParticipants.find(p => p.user_id === currentUser.id)
    const canAdd = userParticipant && 
                   userParticipant.status === 'accepted' && 
                   (userParticipant.role === 'organizer' || userParticipant.role === 'participant')
    
    console.log('Permission check:', {
      currentUser: currentUser?.id,
      selectedTrip: selectedTrip?.id,
      userParticipant,
      canAdd
    })
    
    return canAdd
  }, [currentUser, selectedTrip, allParticipants])

  // Check if current user is an organizer
  const isCurrentUserOrganizer = useCallback(() => {
    if (!currentUser || !allParticipants.length) {
      return false
    }
    const userParticipant = allParticipants.find(p => p.user_id === currentUser.id)
    return userParticipant?.role === 'organizer' && userParticipant?.status === 'accepted'
  }, [currentUser, allParticipants])

  const handleAddExpense = async (expenseData) => {
    // Check permissions before adding expense
    if (!canAddExpenses()) {
      alert('Only organizers and participants can add expenses')
      setShowExpenseModal(false)
      return
    }
    
    try {
      console.log('Adding expense with data:', expenseData)
      console.log('Trip ID:', selectedTrip.id)
      
      const newExpense = await expensesService.createExpense(selectedTrip.id, expenseData)
      console.log('Successfully added expense:', newExpense)
      
      setExpenses(prev => [newExpense, ...prev])
      setShowExpenseModal(false)
    } catch (err) {
      console.error('Error adding expense:', err)
      console.error('Error details:', err.response?.data || err.message)
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add expense'
      alert(`Failed to add expense: ${errorMessage}`)
    }
  }

  const handleEditExpense = async (expenseData) => {
    try {
      const updatedExpense = await expensesService.updateExpense(selectedTrip.id, editingExpense.id, expenseData)
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp))
      setShowEditModal(false)
      setEditingExpense(null)
    } catch (err) {
      console.error('Error updating expense:', err)
      alert('Failed to update expense')
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    
    try {
      await expensesService.deleteExpense(selectedTrip.id, expenseId)
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId))
    } catch (err) {
      console.error('Error deleting expense:', err)
      alert('Failed to delete expense')
    }
  }

  const openEditModal = (expense) => {
    setEditingExpense(expense)
    setShowEditModal(true)
  }

  const filteredExpenses = useMemo(() => {
    return selectedCategory === 'all' 
      ? expenses 
      : expenses.filter(expense => expense.category_id === parseInt(selectedCategory))
  }, [expenses, selectedCategory])

  const { totalSpent, budget, remaining } = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
    const budgetAmount = selectedTrip?.budget || 0
    return {
      totalSpent: total,
      budget: budgetAmount,
      remaining: budgetAmount - total
    }
  }, [expenses, selectedTrip?.budget])

  // Chart data
  const categoryData = useMemo(() => {
    return categories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category_id === category.id)
      const total = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
      return {
        name: category.name,
        value: total,
        color: category.color
      }
    }).filter(item => item.value > 0)
  }, [expenses, categories])

  // Daily spending data for line chart
  const dailyData = useMemo(() => {
    const dailySpending = expenses.reduce((acc, expense) => {
      const date = expense.expense_date || expense.date
      acc[date] = (acc[date] || 0) + parseFloat(expense.amount)
      return acc
    }, {})

    return Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [expenses])

  // Watch categories and set loading/error state
  useEffect(() => {
    if (categories && categories.length > 0) {
      setCategoriesLoading(false)
      setCategoriesError(null)
    } else if (categories && categories.length === 0) {
      // Wait 3 seconds, then show error if still empty
      const timeout = setTimeout(() => {
        setCategoriesLoading(false)
        setCategoriesError('No categories found. Please check your backend or network connection.')
      }, 3000)
      return () => clearTimeout(timeout)
    }
  }, [categories])

  if (categoriesLoading) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading categories...</h2>
          <p className="text-gray-600 mb-6">Please wait while we load your categories.</p>
        </div>
      </div>
    )
  }
  if (categoriesError) {
    return (
      <div className="max-w-7xl mx-auto text-center py-12">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-red-600 mb-2">{categoriesError}</h2>
          <p className="text-gray-600 mb-6">Try refreshing the page or contact support.</p>
        </div>
      </div>
    )
  }

  console.log('Selected trip:', selectedTrip)
  console.log('Trips available:', trips.length)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">កត់ត្រាការចំណាយ</h1>
            <p className="text-gray-600 mt-2">Monitor your travel spending and budget</p>
            {selectedTrip && allParticipants.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {canAddExpenses() ? (
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>You can add and manage expenses for this trip</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span>View-only access - contact trip organizer to add expenses</span>
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
            {trips.length > 0 && (
              <select
                value={selectedTrip?.id || ''}
                onChange={(e) => setSelectedTrip(trips.find(t => t.id === parseInt(e.target.value)))}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
              >
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>{trip.name}</option>
                ))}
              </select>
            )}
            
            {canAddExpenses() && (
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 shadow-lg font-medium"
                style={{ minWidth: '140px' }}
              >
                <Plus className="h-5 w-5" />
                <span>បន្ថែមការចំណាយ</span>
              </button>
            )}
            
            {!canAddExpenses() && selectedTrip && allParticipants.length > 0 && (
              <div className="text-sm text-gray-500 flex items-center justify-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                <Users className="h-4 w-4" />
                <span>Only trip members can add expenses</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">លុយសរុប</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{selectedTrip?.currency === 'KHR' ? '៛' : '$'}{budget.toLocaleString()}</p>
            </div>
            <div className="bg-primary-100 p-2 lg:p-3 rounded-lg">
              <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">សរុបការចំណាយ</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{selectedTrip?.currency === 'KHR' ? '៛' : '$'}{totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-red-100 p-2 lg:p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{((totalSpent / budget) * 100).toFixed(1)}% of budget</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">លុយដែរនៅសល់</p>
              <p className={`text-xl lg:text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedTrip?.currency === 'KHR' ? '៛' : '$'}{Math.abs(remaining).toLocaleString()}
              </p>
            </div>
            <div className={`p-2 lg:p-3 rounded-lg ${remaining >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <DollarSign className={`h-5 w-5 lg:h-6 lg:w-6 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
          {remaining < 0 && (
            <p className="text-sm text-red-600 mt-2">Over budget!</p>
          )}
        </div>
      </div>

      {/* Expense Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {expenses.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {expenses
                .sort((a, b) => new Date(b.created_at || b.expense_date) - new Date(a.created_at || a.expense_date))
                .slice(0, 5)
                .map((expense) => {
                  const category = categories.find(c => c.id === expense.category_id)
                  return (
                    <div key={expense.id} className="flex items-center space-x-3">
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category?.color || '#6B7280' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{expense.title}</p>
                        <p className="text-xs text-gray-500">{expense.user?.name}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900 flex-shrink-0">
                        {expense.currency === 'KHR' ? '៛' : '$'}{parseFloat(expense.amount).toFixed(2)}
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent expenses</p>
          )}
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          {categoryData.slice(0, 4).length > 0 ? (
            <div className="space-y-3">
              {categoryData
                .sort((a, b) => b.value - a.value)
                .slice(0, 4)
                .map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 flex-shrink-0">
                      ${item.value.toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No expenses yet</p>
          )}
        </div>

        {/* Expense Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Expenses</span>
              <span className="text-sm font-medium text-gray-900">{expenses.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shared Expenses</span>
              <span className="text-sm font-medium text-gray-900">
                {expenses.filter(e => e.is_shared).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average per Day</span>
              <span className="text-sm font-medium text-gray-900">
                ${dailyData.length > 0 ? (totalSpent / dailyData.length).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Your Expenses</span>
              <span className="text-sm font-medium text-gray-900">
                {expenses.filter(e => e.user_id === currentUser?.id).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'charts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Charts
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[140px]"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <button 
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Export expenses"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'charts' ? (
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Pie Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                {categoryData.length > 0 ? (
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No expense data to display</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Line Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Spending</h3>
                {dailyData.length > 0 ? (
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${value}`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                          formatter={(value) => [`$${value}`, 'Amount']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ fill: '#3B82F6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No spending data to display</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-6">
            {loadingExpenses ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading expenses...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <DollarSign className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-semibold">Error Loading Expenses</p>
                  <p className="text-sm">{error}</p>
                </div>
                <button
                  onClick={loadExpenses}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory === 'all' 
                    ? 'Start tracking your travel expenses' 
                    : `No expenses in ${categories.find(c => c.id === parseInt(selectedCategory))?.name} category`
                  }
                </p>
                {canAddExpenses() && (
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add First Expense</span>
                  </button>
                )}
                {!canAddExpenses() && selectedTrip && allParticipants.length > 0 && (
                  <p className="text-sm text-gray-500">Only trip members can add expenses</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses
                  .sort((a, b) => new Date(b.expense_date || b.date) - new Date(a.expense_date || a.date))
                  .map((expense) => {
                    const category = categories.find(c => c.id === expense.category_id)
                    // Users can edit their own expenses, organizers can edit any expense
                    const canEdit = expense.user_id === currentUser?.id || isCurrentUserOrganizer()
                    return (
                      <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div 
                              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                              style={{ backgroundColor: category?.color || '#6B7280' }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 break-words">{expense.title || expense.description}</h4>
                              {expense.description && expense.title && (
                                <p className="text-sm text-gray-600 mt-1 break-words">{expense.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                <span className="capitalize">{category?.name || 'Unknown'}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{format(new Date(expense.expense_date || expense.date), 'MMM dd, yyyy')}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>{expense.currency || 'USD'}</span>
                                {expense.user && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center space-x-1">
                                      <span>by</span>
                                      <span className="font-medium">{expense.user.name}</span>
                                    </span>
                                  </>
                                )}
                                {expense.is_shared && (
                                  <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center space-x-1 text-primary-600">
                                      <Users className="h-3 w-3" />
                                      <span>Shared</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end space-x-4">
                            <div className="text-left sm:text-right">
                              <p className="text-lg font-bold text-gray-900">{expense.currency === 'KHR' ? '៛' : '$'}{parseFloat(expense.amount).toFixed(2)}</p>
                              {expense.status && expense.status !== 'approved' && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {expense.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {expense.receipt_url && (
                                <button 
                                  onClick={() => window.open(expense.receipt_url, '_blank')}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                  title="View receipt"
                                >
                                  <Receipt className="h-4 w-4" />
                                </button>
                              )}
                              {canEdit && (
                                <button 
                                  onClick={() => openEditModal(expense)}
                                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                                  title="Edit expense"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded"
                                  title="Delete expense"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          tripId={selectedTrip.id}
          categories={categories}
          participants={participants}
          currentUser={currentUser}
          onSave={handleAddExpense}
          canAddExpenses={canAddExpenses()}
        />
      )}

      {/* Edit Expense Modal */}
      {showEditModal && editingExpense && (
        <ExpenseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingExpense(null)
          }}
          tripId={selectedTrip.id}
          categories={categories}
          participants={participants}
          currentUser={currentUser}
          onSave={handleEditExpense}
          editingExpense={editingExpense}
          isEdit={true}
          canAddExpenses={canAddExpenses()}
        />
      )}
    </div>
  )
}

function ExpenseModal({ isOpen, onClose, tripId, categories, participants, currentUser, onSave, editingExpense = null, isEdit = false, canAddExpenses = true }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category_id: categories.length > 0 ? categories[0].id : '',
    currency: 'USD',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    is_shared: false,
    split_type: 'equal',
    receipt_url: '',
    split_data: {}, // changed to object for backend compatibility
    status: 'approved', // always approved on create
  })
  const [loading, setLoading] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState([])
  const [customSplits, setCustomSplits] = useState({}) // for custom split_type
  const [percentageSplits, setPercentageSplits] = useState({}) // for percentage split_type

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && editingExpense) {
      setFormData({
        title: editingExpense.title || '',
        description: editingExpense.description || '',
        amount: editingExpense.amount || '',
        category_id: editingExpense.category_id || (categories[0]?.id || ''),
        currency: editingExpense.currency || 'USD',
        expense_date: editingExpense.expense_date ? editingExpense.expense_date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
        is_shared: editingExpense.is_shared || false,
        split_type: editingExpense.split_type || 'equal',
        receipt_url: editingExpense.receipt_url || '',
        split_data: editingExpense.split_data || {},
        status: editingExpense.status || 'approved',
      })
      if (editingExpense.is_shared && editingExpense.split_data) {
        if (editingExpense.split_type === 'equal') {
          setSelectedParticipants(editingExpense.split_data.participants || [])
        } else if (editingExpense.split_type === 'custom') {
          setSelectedParticipants(Object.keys(editingExpense.split_data.amounts || {}))
          setCustomSplits(editingExpense.split_data.amounts || {})
        } else if (editingExpense.split_type === 'percentage') {
          setSelectedParticipants(Object.keys(editingExpense.split_data.percentages || {}))
          setPercentageSplits(editingExpense.split_data.percentages || {})
        }
      }
    } else {
      setFormData(f => ({
        ...f,
        category_id: categories[0]?.id || '',
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        is_shared: false,
        split_type: 'equal',
        split_data: {},
        status: 'approved',
      }))
      setSelectedParticipants([])
      setCustomSplits({})
      setPercentageSplits({})
    }
  }, [isEdit, editingExpense, categories])

  // Update category when categories change
  useEffect(() => {
    if (!formData.category_id && categories.length > 0) {
      setFormData(f => ({ ...f, category_id: categories[0].id }))
    }
  }, [categories])

  // Auto-select all participants when switching to shared
  useEffect(() => {
    if (formData.is_shared) {
      setSelectedParticipants(participants.map(p => p.user_id))
    } else {
      setSelectedParticipants([])
    }
  }, [formData.is_shared, participants])

  // Update split_data for backend before submit
  useEffect(() => {
    if (!formData.is_shared) {
      setFormData(f => ({ ...f, split_data: {} }))
      return
    }
    if (formData.split_type === 'equal') {
      setFormData(f => ({
        ...f,
        split_data: {
          participants: selectedParticipants,
        },
      }))
    } else if (formData.split_type === 'custom') {
      setFormData(f => ({
        ...f,
        split_data: {
          amounts: customSplits,
        },
      }))
    } else if (formData.split_type === 'percentage') {
      setFormData(f => ({
        ...f,
        split_data: {
          percentages: percentageSplits,
        },
      }))
    }
  }, [formData.is_shared, formData.split_type, selectedParticipants, customSplits, percentageSplits])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'is_shared') {
      setFormData(f => ({ ...f, is_shared: checked }))
    } else if (name === 'split_type') {
      setFormData(f => ({ ...f, split_type: value }))
      setCustomSplits({})
      setPercentageSplits({})
    } else {
      setFormData(f => ({ ...f, [name]: value }))
    }
  }

  const handleParticipantToggle = (userId) => {
    setSelectedParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
    setCustomSplits(cs => {
      const newSplits = { ...cs }
      if (newSplits[userId]) delete newSplits[userId]
      return newSplits
    })
    setPercentageSplits(ps => {
      const newSplits = { ...ps }
      if (newSplits[userId]) delete newSplits[userId]
      return newSplits
    })
  }

  // Custom split input change
  const handleCustomSplitChange = (userId, value) => {
    setCustomSplits(cs => ({ ...cs, [userId]: value }))
  }
  // Percentage split input change
  const handlePercentageSplitChange = (userId, value) => {
    setPercentageSplits(ps => ({ ...ps, [userId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validation for split_data
      if (formData.is_shared) {
        if (formData.split_type === 'equal' && selectedParticipants.length === 0) {
          alert('Select at least one participant for splitting.')
          setLoading(false)
          return
        }
        if (formData.split_type === 'custom') {
          const total = Object.values(customSplits).reduce((a, b) => a + parseFloat(b || 0), 0)
          if (total !== parseFloat(formData.amount)) {
            alert('Custom split amounts must sum to total amount.')
            setLoading(false)
            return
          }
        }
        if (formData.split_type === 'percentage') {
          const total = Object.values(percentageSplits).reduce((a, b) => a + parseFloat(b || 0), 0)
          if (total !== 100) {
            alert('Percentages must sum to 100.')
            setLoading(false)
            return
          }
        }
      }
      await onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        split_data: formData.is_shared ? formData.split_data : {},
        status: isEdit ? formData.status : 'approved',
      })
      setLoading(false)
      onClose()
    } catch (err) {
      setLoading(false)
      alert('Failed to save expense.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-md" onClick={onClose} />
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEdit ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {!canAddExpenses && !isEdit && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">Permission Required</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Only trip organizers and participants can add new expenses.</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Lunch at restaurant"
                  disabled={loading || (!canAddExpenses && !isEdit)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Additional details..."
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="USD">USD</option>
                    <option value="KHR">KHR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="expense_date"
                    value={formData.expense_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt URL (optional)
                </label>
                <input
                  type="url"
                  name="receipt_url"
                  value={formData.receipt_url}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/receipt.jpg"
                  disabled={loading}
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="is_shared"
                    name="is_shared"
                    checked={formData.is_shared}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    disabled={loading}
                  />
                  <label htmlFor="is_shared" className="text-sm font-medium text-gray-700">
                    <div className="flex items-center space-x-1">
                      <Share2 className="h-4 w-4" />
                      <span>Split this expense with other trip members</span>
                    </div>
                  </label>
                </div>
                {formData.is_shared && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Split Method
                      </label>
                      <select
                        name="split_type"
                        value={formData.split_type}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={loading}
                      >
                        <option value="equal">Split equally among selected members</option>
                        <option value="custom">Custom split amounts</option>
                        <option value="percentage">Split by percentage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Split with ({selectedParticipants.length} selected):
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                        {participants.map(participant => (
                          <label key={participant.user_id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedParticipants.includes(participant.user_id)}
                              onChange={() => handleParticipantToggle(participant.user_id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              disabled={loading}
                            />
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                                {participant.user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm text-gray-700">{participant.user.name}</span>
                              {participant.user_id === currentUser?.id && (
                                <span className="text-xs text-primary-600 font-medium">(You)</span>
                              )}
                            </div>
                            {/* Custom/percentage split input */}
                            {formData.split_type === 'custom' && selectedParticipants.includes(participant.user_id) && (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="ml-2 w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                                placeholder="$"
                                value={customSplits[participant.user_id] || ''}
                                onChange={e => handleCustomSplitChange(participant.user_id, e.target.value)}
                                disabled={loading}
                              />
                            )}
                            {formData.split_type === 'percentage' && selectedParticipants.includes(participant.user_id) && (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="ml-2 w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                                placeholder="%"
                                value={percentageSplits[participant.user_id] || ''}
                                onChange={e => handlePercentageSplitChange(participant.user_id, e.target.value)}
                                disabled={loading}
                              />
                            )}
                          </label>
                        ))}
                      </div>
                      {/* Show per-user split info for equal split */}
                      {formData.is_shared && formData.split_type === 'equal' && selectedParticipants.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                          Each person will pay $
                            {(parseFloat(formData.amount || 0) / selectedParticipants.length).toFixed(2)
                          }
                        </p>
                      )}
                      {/* Show sum check for custom/percentage */}
                      {formData.is_shared && formData.split_type === 'custom' && selectedParticipants.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                          Total: ${Object.values(customSplits).reduce((a, b) => a + parseFloat(b || 0), 0).toFixed(2)} / ${formData.amount || 0}
                        </p>
                      )}
                      {formData.is_shared && formData.split_type === 'percentage' && selectedParticipants.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                          Total: {Object.values(percentageSplits).reduce((a, b) => a + parseFloat(b || 0), 0)}% / 100%
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors order-2 sm:order-1"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  disabled={loading || (!canAddExpenses && !isEdit)}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  <span>
                    {loading ? 'Saving...' : 
                     (!canAddExpenses && !isEdit) ? 'No Permission' :
                     (isEdit ? 'Update Expense' : 'Add Expense')
                    }
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
