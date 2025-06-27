import React, { useState } from 'react'
import { X, Calendar, MapPin, DollarSign, FileText } from 'lucide-react'

export default function CreateTripModal({ isOpen, onClose }) {
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
  const [loading, setLoading] = useState(false)

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
    if (!formData.name.trim()) newErrors.name = 'Trip name is required'
    if (!formData.destination.trim()) newErrors.destination = 'Destination is required'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'
    else if (formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
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
    if (!validateForm()) return

    setLoading(true)
    setErrors({})
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        currency: formData.currency
      }

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.status === 201) {
        setFormData({
          name: '',
          description: '',
          destination: '',
          start_date: '',
          end_date: '',
          budget: '',
          currency: 'USD'
        })
        setErrors({})
        onClose()
      } else if (data.errors) {
        setErrors(data.errors)
      } else {
        setErrors({ general: data.message || 'Failed to create trip. Please try again.' })
      }
    } catch (error) {
      setErrors({ general: 'Failed to create trip. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-3 py-4 lg:px-4 text-center">
        <div className="fixed inset-0 bg-white bg-opacity-40 backdrop-blur-md transition-opacity" onClick={onClose} />

        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg max-h-screen overflow-y-auto">
          <div className="bg-white px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-medium text-gray-900">Create New Trip</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
              >
                <X className="h-5 w-5 lg:h-6 lg:w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-xs lg:text-sm">{errors.general}</p>
                </div>
              )}

              {/* Trip Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 lg:py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-h-[44px] ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Summer Vacation 2025"
                  />
                  <FileText className="absolute left-3 top-2.5 lg:top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Destination */}
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 lg:py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-h-[44px] ${
                      errors.destination ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Paris, France"
                  />
                  <MapPin className="absolute left-3 top-2.5 lg:top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2.5 lg:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base resize-none"
                  placeholder="Brief description of your trip..."
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2.5 lg:py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-h-[44px] ${
                        errors.start_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <Calendar className="absolute left-3 top-2.5 lg:top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleChange}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2.5 lg:py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-h-[44px] ${
                        errors.end_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <Calendar className="absolute left-3 top-2.5 lg:top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
                </div>
              </div>

              {/* Budget and Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
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
                      className={`w-full px-3 py-2.5 lg:py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-h-[44px] ${
                        errors.budget ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    <DollarSign className="absolute left-3 top-2.5 lg:top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.budget && <p className="text-red-500 text-xs mt-1">{errors.budget}</p>}
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 lg:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base min-h-[44px]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 lg:pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="order-2 sm:order-1 px-4 py-2.5 lg:py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm lg:text-base min-h-[44px] touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="order-1 sm:order-2 px-4 py-2.5 lg:py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base min-h-[44px] touch-manipulation"
                >
                  {loading ? 'Creating...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
