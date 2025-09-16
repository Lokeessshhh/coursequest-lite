const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Import database connection (this will test connection on startup)
const db = require('./db');

// Import route handlers
const ingestRoutes = require('./routes/ingest');
const coursesRoutes = require('./routes/courses');
const compareRoutes = require('./routes/compare');
const askRoutes = require('./routes/ask');

/**
 * CourseQuest Lite API Server
 * Express.js server with PostgreSQL integration for course data management
 */

// Step 1: Create Express application instance
const app = express();

// Step 2: Set up server configuration
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Step 3: Configure middleware stack
console.log('🔧 Setting up middleware...');

// Enable CORS for cross-origin requests (useful for frontend integration)
app.use(cors({
  origin: NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://coursequest-lite-1.onrender.com/'
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'], // Added Vite default port
  credentials: true
}));

// Parse JSON payloads (limit to 10MB for file uploads)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded payloads (for form submissions)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (simple logger)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📝 ${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Step 4: Define application routes

// Root route - API health check
app.get('/', (req, res) => {
  res.json({
    message: 'CourseQuest Lite API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check route for monitoring services
app.get('/health', async (req, res) => {
  try {
    // Test database connectivity
    await db.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Step 5: Mount API routes
console.log('🛣️  Setting up API routes...');

// Mount all route handlers at /api path
app.use('/api', ingestRoutes);
app.use('/api', coursesRoutes);
app.use('/api', compareRoutes);
app.use('/api', askRoutes);

// Step 6: Error handling middleware

// Handle 404 - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/ingest',
      'GET /api/courses',
      'GET /api/compare',
      'POST /api/ask'
    ]
  });
});

// Global error handler - catch all unhandled errors
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  
  // Don't expose internal errors in production
  const message = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Step 7: Start the server
const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log('🚀 CourseQuest Lite API Server Started');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}`);
    console.log('📋 Available endpoints:');
    console.log('   GET  / - API status');
    console.log('   GET  /health - Health check');
    console.log('   POST /api/ingest - CSV upload');
    console.log('   GET  /api/courses - Search and filter courses');
    console.log('   GET  /api/compare - Compare multiple courses');
    console.log('   POST /api/ask - Natural language course search');
    console.log('===============================================');
  });

  // Step 8: Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connections
      if (db.pool) {
        db.pool.end(() => {
          console.log('✅ Database connections closed');
          console.log('👋 Server shutdown complete');
          process.exit(0);
        });
      } else {
        console.log('👋 Server shutdown complete');
        process.exit(0);
      }
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.log('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });

  return server;
};

// Step 9: Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

// Export app for testing purposes
module.exports = app;
