const { Pool } = require('pg');

/**
 * Database connection configuration for Neon Postgres
 * Uses connection pooling for better performance and resource management
 */

// Step 1: Read database connection URL from environment variables
const connectionString = process.env.DATABASE_URL;

// Step 2: Validate that DATABASE_URL is provided
if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set your Neon database connection URL in the environment variables');
  process.exit(1);
}

// Step 3: Create PostgreSQL connection pool
// Connection pooling allows multiple queries to run concurrently
// and manages connections efficiently
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon and most cloud Postgres providers
  },
  // Connection pool configuration optimized for Neon
  max: 10, // Maximum number of connections in the pool (reduced for Neon limits)
  min: 1, // Minimum number of connections to maintain
  idleTimeoutMillis: 60000, // Close idle connections after 60 seconds
  connectionTimeoutMillis: 10000, // Timeout after 10 seconds (increased for slow networks)
  acquireTimeoutMillis: 10000, // Time to wait for connection from pool
  createTimeoutMillis: 10000, // Time to wait when creating new connection
  destroyTimeoutMillis: 5000, // Time to wait when destroying connection
  createRetryIntervalMillis: 200, // Interval between connection retry attempts
});

// Step 4: Test database connection on startup
const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    
    // Attempt to connect and run a simple query
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    
    console.log('✅ Database connection successful!');
    console.log(`📅 Server time: ${result.rows[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result.rows[0].pg_version.split(',')[0]}`);
    
    // Release the client back to the pool
    client.release();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your DATABASE_URL and network connectivity');
    
    // Exit the application if database connection fails
    // This ensures the app doesn't start without a working database
    process.exit(1);
  }
};

// Step 5: Handle pool events for monitoring and debugging
pool.on('connect', (client) => {
  console.log('🔗 New database client connected');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database pool error:', err.message);
  // Don't exit here as this might be a temporary network issue
});

pool.on('remove', (client) => {
  console.log('🔌 Database client removed from pool');
});

// Step 6: Graceful shutdown handler
// Properly close all database connections when the application terminates
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down database connections...');
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database shutdown:', error.message);
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Step 7: Test connection immediately when module is loaded
testConnection();

// Step 8: Export the pool for use in other modules
// This allows other parts of the application to execute queries
module.exports = {
  pool,
  query: (text, params) => pool.query(text, params), // Convenience method for queries
};