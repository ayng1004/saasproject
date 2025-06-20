// connection-test.js
const { Pool } = require('pg');
const axios = require('axios');

// Configuration pour les tests
const services = [
  {
    name: 'Users Service',
    dbConfig: {
      host: process.env.USERS_DB_HOST || 'localhost',
      port: process.env.USERS_DB_PORT || 5432,
      database: process.env.USERS_DB_NAME || 'users_db',
      user: process.env.USERS_DB_USER || 'postgres',
      password: process.env.USERS_DB_PASSWORD || 'postgres_password',
    },
    healthEndpoint: 'http://localhost:4001/health'
  },
  {
    name: 'Events Service',
    dbConfig: {
      host: process.env.EVENTS_DB_HOST || 'localhost',
      port: process.env.EVENTS_DB_PORT || 5432,
      database: process.env.EVENTS_DB_NAME || 'events_db',
      user: process.env.EVENTS_DB_USER || 'postgres',
      password: process.env.EVENTS_DB_PASSWORD || 'postgres_password',
    },
    healthEndpoint: 'http://localhost:4002/health'
  }
];

// Fonction pour tester la connexion à la base de données
async function testDbConnection(config, serviceName) {
  console.log(`🔄 Testing database connection for ${serviceName}...`);
  
  const pool = new Pool({
    ...config,
    connectionTimeoutMillis: 5000, // 5 seconds timeout
    idleTimeoutMillis: 5000,
  });
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    
    console.log(` Database connection successful for ${serviceName}`);
    console.log(`   Current database time: ${result.rows[0].now}`);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error(` Database connection failed for ${serviceName}`);
    console.error(`   Error: ${error.message}`);
    
    try {
      await pool.end();
    } catch (endError) {
      // Ignore errors when ending the pool
    }
    
    return false;
  }}