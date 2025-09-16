import React, { useState } from 'react'
import ResultsTable from '../components/ResultsTable'
import Loader from '../components/Loader'

const AskAIPage = () => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  const handleSubmit = async (e, page = 1) => {
    e?.preventDefault()

    if (!query.trim()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const response = await fetch(`${API_BASE}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query.trim(),
          page: page,
          per_page: 10
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      setResults(data.data || [])
      setTotalResults(data.meta?.total_count || 0)
      setTotalPages(data.meta?.total_pages || 1)
      setCurrentPage(data.meta?.page || 1)

    } catch (err) {
      setError(err.message || 'Failed to process your query')
      setResults([])
      setTotalResults(0)
      setTotalPages(1)
      setCurrentPage(1)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      handleSubmit(null, page)
    }
  }

  const exampleQueries = [
    "Find beginner-friendly Python courses under $50",
    "Show me free web development courses from Coursera",
    "I want intermediate data science courses with certificates",
    "Advanced machine learning courses longer than 20 hours",
    "Business courses for project management"
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ask AI</h1>
        <p className="mt-2 text-gray-600">
          Use natural language to find courses. Just describe what you're looking for!
        </p>
      </div>

      {/* Query Input */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
              What course are you looking for?
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., I want to learn React.js for beginners with a certificate under $100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              disabled={loading}
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Search with AI'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults([])
                setError(null)
                setCurrentPage(1)
                setTotalPages(1)
                setTotalResults(0)
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>

        {/* Example Queries */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Try these examples:</h4>
          <div className="space-y-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded transition-colors"
                disabled={loading}
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error processing query</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Loader text="AI is analyzing your request..." />
      )}



      {/* Results */}
      {results && !loading && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Found {totalResults} course{totalResults !== 1 ? 's' : ''} matching your request
            </h2>
          </div>
          <ResultsTable
            courses={results}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* No Results */}
      {results && results.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.084-2.327" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
          <p className="mt-2 text-gray-500">
            Try rephrasing your query or being more specific about what you're looking for.
          </p>
        </div>
      )}
    </div>
  )
}

export default AskAIPage