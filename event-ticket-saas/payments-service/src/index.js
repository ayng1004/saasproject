const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json(), cors(), helmet(), morgan('dev'));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'payments_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
});

const PORT = process.env.PORT || 4005;

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payments-service' });
});

app.post('/api/payments', async (req, res) => {
  const { user_id, ticket_id, amount } = req.body;
  if (!user_id || !ticket_id || !amount) {
    return res.status(400).json({ message: 'Missing payment data' });
  }

  await new Promise(resolve => setTimeout(resolve, 1000)); // simulate delay
  const status = 'paid';
  const payment_method = 'credit_card';
  const transaction_id = `TRX-${uuidv4()}`;

  try {
    // Vérifie que le ticket existe (optionnel)
    const ticketRes = await axios.get(`http://tickets-service:4003/api/tickets/${ticket_id}`);
    if (!ticketRes.data) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Insère le paiement
    const result = await pool.query(
      `INSERT INTO payments (user_id, ticket_id, amount, payment_method, transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, ticket_id, amount, payment_method, transaction_id, status]
    );

    // Envoie la notification
    try {
      await axios.post('http://notifications-service:4004/api/notifications', {
        user_id,
        type: 'ticket_purchase',
        data: {
          firstName: 'Utilisateur',
          eventName: 'Concert Test',
          ticketNumber: ticket_id,
          eventDate: '2025-04-12'
        }
      });
      console.log(' Notification envoyée');
    } catch (notifErr) {
      console.error(' Notification échouée:', notifErr.message);
    }

    res.status(201).json({
      message: 'Payment processed',
      payment: result.rows[0]
    });

  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ message: 'Payment failed' });
  }
});

const waitForDb = async (retries = 10, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log(' DB is ready');
      return;
    } catch (err) {
      console.log(`Waiting for DB (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('DB not reachable');
};

const initDb = async () => {
  await waitForDb();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        ticket_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(" Table 'payments' initialisée.");
  } catch (err) {
    console.error(' Erreur init DB:', err);
  } finally {
    client.release();
  }
};

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(` Payments service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start Payments service:', err);
  });
