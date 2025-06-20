// microservice-users/src/index.js
const { app, pool } = require('./app');

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables initialized');

    // Create admin user if doesn't exist
    const adminExists = await client.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin@example.com', hashedPassword, 'Admin', 'User', 'Admin']
      );
      console.log('Admin user created');
    }
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
}

// Lancement du serveur uniquement si on exécute `node index.js`
if (require.main === module) {
  const port = process.env.PORT || 4001;
  initDb().then(() => {
    app.listen(port, () => {
      console.log(`Users service running on port ${port}`);
    });
  });
}

module.exports = { app, initDb };
