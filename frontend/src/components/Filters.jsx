import React, { useState, useEffect } from 'react'

const DEFAULT_OPTIONS = {
  departments: [
    'Computer Science',
    'Management',
    'Electrical Engineering',
    'Arts',
    'Design',
    'Law',
    'Medicine',
    'Commerce'
  ],
  levels: ['UG', 'PG'],
  delivery_modes: ['online', 'offline', 'hybrid'],
  years: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']
}

const Filters = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    q: '',
    department: '',
    level: '',
    delivery_mode: '',
    year_offered: '',
    min_credits: '',
    max_credits: '',
    min_duration_weeks: '',
    max_duration_weeks: '',
    min_rating: '',
    max_rating: '',
    min_fee: '',
    max_fee: '',
    ...initialFilters
  })

  const [dropdownOptions, setDropdownOptions] = useState(DEFAULT_OPTIONS)

  useEffect(() => {
    setDropdownOptions(DEFAULT_OPTIONS)
    fetchFilterOptions()
  }, [])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/filter-options')
      if (response.ok) {
        const data = await response.json()
        if (
          data &&
          Array.isArray(data.departments) && data.departments.length &&
          Array.isArray(data.levels) && data.levels.length &&
          Array.isArray(data.delivery_modes) && data.delivery_modes.length &&
          Array.isArray(data.years) && data.years.length
        ) {
          setDropdownOptions(data)
        } else {
          console.warn('Filter API returned invalid or empty data, using fallback', data)
        }
      } else {
        console.error('Failed fetch filter options (not ok)', response)
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = ''
      return acc
    }, {})
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Course Name
        </label>
        <input
          type="text"
          placeholder="Enter course name..."
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => handleFilterChange('department', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Department</option>
            {dropdownOptions.departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level
          </label>
          <select
            value={filters.level}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Level</option>
            {dropdownOptions.levels.map((level) => (
              <option key={level} value={level}>
                {level === 'UG' ? 'Undergraduate' : level === 'PG' ? 'Postgraduate' : level}
              </option>
            ))}
          </select>
        </div>

        {/* Delivery Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Mode
          </label>
          <select
            value={filters.delivery_mode}
            onChange={(e) => handleFilterChange('delivery_mode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Mode</option>
            {dropdownOptions.delivery_modes.map((mode) => (
              <option key={mode} value={mode}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Year Offered */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Offered
          </label>
          <select
            value={filters.year_offered}
            onChange={(e) => handleFilterChange('year_offered', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Year</option>
            {dropdownOptions.years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Numeric Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Credits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credits
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_credits}
              onChange={(e) => handleFilterChange('min_credits', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_credits}
              onChange={(e) => handleFilterChange('max_credits', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Duration Weeks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (Weeks)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_duration_weeks}
              onChange={(e) => handleFilterChange('min_duration_weeks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_duration_weeks}
              onChange={(e) => handleFilterChange('max_duration_weeks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Min"
              value={filters.min_rating}
              onChange={(e) => handleFilterChange('min_rating', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Max"
              value={filters.max_rating}
              onChange={(e) => handleFilterChange('max_rating', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tuition Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tuition Fee (INR)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.min_fee}
              onChange={(e) => handleFilterChange('min_fee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.max_fee}
              onChange={(e) => handleFilterChange('max_fee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Filters
