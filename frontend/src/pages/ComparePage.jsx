import React, { useState, useEffect } from 'react'
import { useCompare } from '../App'
import Loader from '../components/Loader'

const ComparePage = () => {
  const { compareList, removeFromCompare, clearCompare } = useCompare()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (compareList.length > 0) {
      fetchComparisonData()
    } else {
      setCourses([])
    }
  }, [compareList])

  const fetchComparisonData = async () => {
    setLoading(true)
    setError(null)
    try {
      const ids = compareList.join(',')
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_BASE}/api/compare?ids=${ids}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setCourses(data.courses || data.data || data)
    } catch (err) {
      console.error('Error fetching comparison data:', err)
      setError('Failed to fetch course comparison data. Please try again.')
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatRating = (rating) => {
    return rating ? `${parseFloat(rating).toFixed(1)} ⭐` : 'N/A'
  }

  const comparisonFields = [
    { key: 'course_name', label: 'Course Name' },
    { key: 'department', label: 'Department' },
    { key: 'level', label: 'Level' },
    { key: 'delivery_mode', label: 'Delivery Mode' },
    { key: 'credits', label: 'Credits' },
    { key: 'duration_weeks', label: 'Duration (weeks)' },
    { key: 'rating', label: 'Rating', formatter: formatRating },
    { key: 'tuition_fee_inr', label: 'Tuition Fee', formatter: formatCurrency },
    { key: 'year_offered', label: 'Year Offered' }
  ]

  if (compareList.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">No Courses to Compare</h3>
        <p className="text-gray-500 mb-4">
          Start by adding courses to your comparison list from the search page.
        </p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Go to Search
        </a>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader size="large" />
        <span className="ml-3 text-gray-600">Loading comparison data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Comparing {courses.length} course{courses.length !== 1 ? 's' : ''}
        </h1>
        <button
          onClick={clearCompare}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Field
                </th>
                {courses.map((course, index) => (
                  <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                    <div className="flex justify-between items-center">
                      Course {index + 1}
                      <button
                        onClick={() => removeFromCompare(course.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                        title="Remove from comparison"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparisonFields.map((field, fieldIndex) => (
                <tr key={field.key} className={fieldIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.label}
                  </td>
                  {courses.map((course, courseIndex) => {
                    let value = course[field.key]
                    if (field.formatter) {
                      value = field.formatter(value)
                    } else if (value === null || value === undefined) {
                      value = 'N/A'
                    }
                    
                    return (
                      <td key={courseIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {field.key === 'course_name' ? (
                          <span className="font-medium text-blue-600">{value}</span>
                        ) : field.key === 'level' ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {value}
                          </span>
                        ) : field.key === 'delivery_mode' ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {value}
                          </span>
                        ) : (
                          <span>{value}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ComparePage
