import React, { useState, useEffect } from 'react'
import Filters from '../components/Filters'
import ResultsTable from '../components/ResultsTable'

const SearchPage = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  
  const ITEMS_PER_PAGE = 10

  // Load initial data - now only loads when user applies filters
  useEffect(() => {
    // Don't auto-load data on initial render, wait for user to search/filter
  }, [])

  // Fetch courses when filters or page changes
  useEffect(() => {
    // Only fetch if user has applied some filters or search
    if (hasFiltersApplied(filters)) {
      fetchCourses(filters, currentPage)
      setHasSearched(true)
    }
  }, [filters, currentPage])

  const hasFiltersApplied = (filtersObj) => {
    return Object.values(filtersObj).some(value => 
      value && value.toString().trim() !== ''
    )
  }

  const buildQueryParams = (filtersObj = {}, page = 1) => {
    const params = new URLSearchParams()
    
    // Map frontend filter keys to backend query parameters
    Object.entries(filtersObj).forEach(([key, value]) => {
      if (value && value.toString().trim()) {
        if (key === 'search') {
          params.append('q', value)
        } else if (key === 'credits_min') {
          params.append('min_credits', value)
        } else if (key === 'credits_max') {
          params.append('max_credits', value)
        } else if (key === 'duration_weeks_min') {
          params.append('min_duration_weeks', value)
        } else if (key === 'duration_weeks_max') {
          params.append('max_duration_weeks', value)
        } else if (key === 'rating_min') {
          params.append('min_rating', value)
        } else if (key === 'rating_max') {
          params.append('max_rating', value)
        } else if (key === 'tuition_fee_inr_min') {
          params.append('min_fee', value)
        } else if (key === 'tuition_fee_inr_max') {
          params.append('max_fee', value)
        } else {
          params.append(key, value)
        }
      }
    })
    
    // Add pagination
    params.append('page', page.toString())
    params.append('per_page', ITEMS_PER_PAGE.toString())
    
    return params.toString()
  }

  const fetchCourses = async (filtersObj = {}, page = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const queryString = buildQueryParams(filtersObj, page)
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_BASE}/api/courses?${queryString}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      setCourses(data.data || data.courses || data)
      setTotalResults(data.meta?.total_count || data.total || data.totalResults || (data.data?.length || data.courses?.length || data.length || 0))
      setTotalPages(data.meta?.total_pages || data.totalPages || Math.ceil((data.meta?.total_count || data.total || data.totalResults || 0) / ITEMS_PER_PAGE))
      
    } catch (err) {
      console.error('Error fetching courses:', err)
      setError('Failed to fetch courses. Please check if the backend server is running.')
      setCourses([])
      setTotalResults(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page when filters change
    
    // If all filters are cleared, reset the search state
    if (!hasFiltersApplied(newFilters)) {
      setCourses([])
      setTotalResults(0)
      setTotalPages(1)
      setHasSearched(false)
    }
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderNoFiltersMessage = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
      <div className="flex justify-center mb-4">
        <svg className="h-16 w-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Course Search</h3>
      <p className="text-gray-600 mb-4">
        Use the search bar above to find courses by name, or apply filters to narrow down your options.
      </p>
      <div className="text-sm text-gray-500">
        <p>You can search by:</p>
        <ul className="mt-2 space-y-1">
          <li>• Course name (e.g., "Machine Learning", "Web Development")</li>
          <li>• Department, Level, Delivery Mode</li>
          <li>• Credits, Duration, Rating, or Tuition Fee ranges</li>
        </ul>
      </div>
    </div>
  )

  const renderNoResultsMessage = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
      <div className="flex justify-center mb-4">
        <svg className="h-16 w-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33M15 21H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
      <p className="text-gray-600 mb-4">
        No courses match your current search criteria. Try adjusting your filters or search terms.
      </p>
      <button
        onClick={() => handleFiltersChange({})}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Clear All Filters
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Search</h1>
        <p className="text-lg text-gray-600">
          Find the perfect course for your educational journey
        </p>
      </div>

      {/* Filters */}
      <Filters 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!hasFiltersApplied(filters) && !hasSearched ? (
        renderNoFiltersMessage()
      ) : hasSearched && totalResults === 0 && !loading ? (
        renderNoResultsMessage()
      ) : (
        <ResultsTable
          courses={courses}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}

export default SearchPage
