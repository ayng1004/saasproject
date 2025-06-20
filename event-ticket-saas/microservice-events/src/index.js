const { app, pool } = require('./app');
// Initialisation de la base de données (création des tables et insertion de catégories par défaut)
async function initDb() {
  const client = await pool.connect();
  try {
    // Création de la table des événements
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255) NOT NULL,
        event_date TIMESTAMP NOT NULL,
        total_seats INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        creator_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Création de la table des catégories d'événements
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    
    // Table de liaison entre événements et catégories
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_category_mapping (
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES event_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (event_id, category_id)
      );
    `);
    
    // Insertion des catégories par défaut
    const categories = ['Concert', 'Conference', 'Workshop', 'Exhibition', 'Sport', 'Festival'];
    for (const category of categories) {
      await client.query(
        'INSERT INTO event_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [category]
      );
    }
    
    console.log('Database tables initialized');
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


