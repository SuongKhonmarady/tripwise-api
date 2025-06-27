import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTrip } from '../context/TripContext'
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText,
  ArrowLeft,
  Globe,
  Users
} from 'lucide-react'

export default function CreateTrip() {
  const navigate = useNavigate()
  const { createTrip, loading } = useTrip()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'USD'
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Trip name is required'
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required'
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required'
    }
    
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required'
    } else if (formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date'
    }
    
    if (formData.budget && (isNaN(formData.budget) || parseFloat(formData.budget) < 0)) {
      newErrors.budget = 'Budget must be a valid positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const tripData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        currency: formData.currency
      }
      
      const newTrip = await createTrip(tripData)
      navigate('/dashboard')
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        setErrors({ 
          general: error.response?.data?.message || 'Failed to create trip. Please try again.' 
        })
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-3 lg:mb-4 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100 touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="text-sm lg:text-base">Back to Dashboard</span>
        </button>
        
        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">រៀបចំបង្កើតគម្រោងដើរលេងថ្មី</h1>
          <p className="text-gray-600 text-sm lg:text-base">Plan your next adventure with detailed information</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6 border-b border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Trip Information</h2>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">បំពេញព័ត៌មានលម្អិតអំពីការធ្វើដំណើរនាពេលខាងមុខ</p>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4">
                <p className="text-red-800 text-sm lg:text-base">{errors.general}</p>
              </div>
            )}

            {/* Trip Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                ឈ្មោះគម្រោងដើរលេង *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm lg:text-base min-h-[44px] ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Bestfriends trip in 2026"
                />
                <FileText className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.name && <p className="text-red-500 text-xs lg:text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Destination */}
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">
                ទីតាំង គោលដៅ *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm lg:text-base min-h-[44px] ${
                    errors.destination ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., កំពត, សៀមរាប"
                />
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {errors.destination && <p className="text-red-500 text-xs lg:text-sm mt-1">{errors.destination}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm lg:text-base resize-none"
                placeholder="Brief description of your trip, what you plan to do, places to visit..."
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  ចាប់ផ្ដើមនៅថ្ងៃ *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm lg:text-base min-h-[44px] ${
                      errors.start_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.start_date && <p className="text-red-500 text-xs lg:text-sm mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                  បញ្ចប់នៅថ្ងៃ *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm lg:text-base min-h-[44px] ${
                      errors.end_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <Calendar className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.end_date && <p className="text-red-500 text-xs lg:text-sm mt-1">{errors.end_date}</p>}
              </div>
            </div>

            {/* Budget and Currency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  ថវិកាដើរលេង (អាចកែសម្រួលបានពេលក្រោយ)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm lg:text-base min-h-[44px] ${
                      errors.budget ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  <DollarSign className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.budget && <p className="text-red-500 text-xs lg:text-sm mt-1">{errors.budget}</p>}
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  រូបិយប័ណ្ណគិតជា
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors appearance-none bg-white text-sm lg:text-base min-h-[44px]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">រៀល (៛)</option>
                  </select>
                  <Globe className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 lg:pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="order-2 sm:order-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm lg:text-base min-h-[44px] touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="order-1 sm:order-2 px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center text-sm lg:text-base min-h-[44px] touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Creating Trip...</span>
                  </>
                ) : (
                  'Create Trip'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-6 lg:mt-8 bg-blue-50 rounded-lg p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-blue-900 mb-2 lg:mb-3">💡 Planning Tips</h3>
        <ul className="space-y-2 text-blue-800 text-sm lg:text-base">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Choose a descriptive name that helps you identify the trip easily</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Set a realistic budget to help track your expenses throughout the trip</span>
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>You can always edit these details later as your plans evolve</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
