import React, { createContext, useContext, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import SearchPage from './pages/SearchPage'
import ComparePage from './pages/ComparePage'
import AskAIPage from './pages/AskAIPage'

// Compare Context
const CompareContext = createContext()

export const useCompare = () => {
  const context = useContext(CompareContext)
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider')
  }
  return context
}

const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState([])

  const addToCompare = (courseId) => {
    if (!compareList.includes(courseId) && compareList.length < 5) {
      setCompareList(prev => [...prev, courseId])
      return true
    }
    return false
  }

  const removeFromCompare = (courseId) => {
    setCompareList(prev => prev.filter(id => id !== courseId))
  }

  const clearCompare = () => {
    setCompareList([])
  }

  const isInCompare = (courseId) => {
    return compareList.includes(courseId)
  }

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      maxReached: compareList.length >= 5
    }}>
      {children}
    </CompareContext.Provider>
  )
}

const Navigation = () => {
  const location = useLocation()
  const { compareList } = useCompare()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Search', icon: '🔍' },
    { path: '/compare', label: 'Compare', icon: '⚖️', badge: compareList.length },
    { path: '/ask-ai', label: 'Ask AI', icon: '🤖' }
  ]

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <span className="text-2xl">📚</span>
            <span className="hidden sm:block">Course Search Platform</span>
            <span className="sm:hidden">Courses</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative flex items-center space-x-1 ${
                  isActive(item.path)
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-blue-500">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors flex items-center space-x-2 ${
                    isActive(item.path)
                      ? 'bg-blue-800 text-white'
                      : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Course Search Platform</h3>
            <p className="text-gray-300 text-sm">
              Find and compare courses across various departments and institutions. 
              Make informed decisions about your educational journey.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Advanced course search and filtering</li>
              <li>• Side-by-side course comparison</li>
              <li>• AI-powered course recommendations</li>
              <li>• Comprehensive course information</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Search Tips</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Use specific course names for better results</li>
              <li>• Apply multiple filters to narrow down options</li>
              <li>• Compare up to 5 courses at once</li>
              <li>• Ask AI for personalized recommendations</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Course Search Platform. Built for educational discovery.
          </p>
        </div>
      </div>
    </footer>
  )
}

function App() {
  return (
    <Router>
      <CompareProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<SearchPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/ask-ai" element={<AskAIPage />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </CompareProvider>
    </Router>
  )
}

export default App
