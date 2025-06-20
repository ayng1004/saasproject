console.log('Tickets microservice starting...');
const setupSwagger = require('./swagger');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 4003;

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Gestion des billets
 *
 * /health:
 *   get:
 *     summary: Vérifie la santé du microservice
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Service OK
 *
 * /api/tickets:
 *   get:
 *     summary: Récupérer tous les billets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: Liste des billets
 *
 * /api/tickets/availability/{eventId}:
 *   get:
 *     summary: Vérifie la disponibilité des billets pour un événement
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails sur les places disponibles
 *
 * /api/tickets/my:
 *   get:
 *     summary: Récupérer les billets de l'utilisateur connecté
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des billets de l'utilisateur
 *
 * /api/tickets/user/{userId}:
 *   get:
 *     summary: Récupérer les billets d'un utilisateur spécifique
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des billets de l'utilisateur
 *
 * /api/tickets/{id}:
 *   get:
 *     summary: Récupérer un billet par ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Billet trouvé
 *       404:
 *         description: Billet introuvable
 *
 *   put:
 *     summary: Mettre à jour le statut d’un billet
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Billet mis à jour
 *       404:
 *         description: Billet introuvable
 *
 * /api/tickets/purchase:
 *   post:
 *     summary: Acheter un billet pour un événement
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_id
 *               - payment_method
 *             properties:
 *               event_id:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *               card_number:
 *                 type: string
 *               expiry:
 *                 type: string
 *               cvv:
 *                 type: string
 *     responses:
 *       201:
 *         description: Achat effectué avec succès
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur serveur
 */



app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));


const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tickets_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
});


const eventsServiceUrl = process.env.EVENTS_SERVICE_URL || 'http://events-service:4002';
const notificationsServiceUrl = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4004';


const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        ticket_number VARCHAR(50) UNIQUE NOT NULL,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'reserved',
        price DECIMAL(10, 2) NOT NULL,
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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
    

    console.log('Tickets database tables initialized');
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
};


const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header is required' });
  const token = authHeader.split(' ')[1];



  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};



const generateTicketNumber = () => {
  const timestamp = new Date().getTime().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${timestamp}-${random}`;
};

const checkAvailableSeats = async (eventId) => {
  try {
    // Récupération des détails de l'événement
    const eventResponse = await axios.get(`${eventsServiceUrl}/api/events/${eventId}`);

    // Vérification si l'API renvoie bien des données valides
    if (!eventResponse || !eventResponse.data) {
      throw new Error('Event data not found');
    }

    const event = eventResponse.data;

    // Vérification des propriétés de l'événement
    if (!event.total_seats || event.total_seats <= 0) {
      throw new Error('Invalid total_seats value in event data');
    }

    // Calcul du nombre de tickets réservés - SANS utiliser FOR UPDATE
    const ticketsResult = await pool.query(
      'SELECT COUNT(*) as sold FROM tickets WHERE event_id = $1 AND status != $2',
      [eventId, 'cancelled']
    );

    const soldTickets = parseInt(ticketsResult.rows[0].sold);
    const availableSeats = event.total_seats - soldTickets;

    // Validation de la disponibilité des places
    if (availableSeats < 0) {
      throw new Error('More tickets sold than total seats');
    }

    // Retourner les informations de l'événement et les places disponibles
    return {
      eventDetails: event,
      totalSeats: event.total_seats,
      soldTickets,
      availableSeats
    };
  } catch (error) {
    // Capture de l'erreur et affichage dans les logs
    console.error('Error checking available seats:', error);

    // Réponse d'erreur détaillée avec message et stack
    throw new Error(`Could not verify available seats: ${error.message}`);
  }
};
// Routes



app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'tickets-service' });
});





app.get('/api/tickets', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, p.status as payment_status, p.payment_method, p.transaction_id
      FROM tickets t
      LEFT JOIN payments p ON t.id = p.ticket_id
      ORDER BY t.created_at DESC
    `);


    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});




app.get('/api/tickets/availability/:eventId', async (req, res) => {
  const eventId = parseInt(req.params.eventId);

  try {
    const availability = await checkAvailableSeats(eventId);
    res.json(availability);
  } catch (err) {
    console.error('Error checking availability:', err);
    res.status(500).json({ message: 'Error checking ticket availability' });
  }
});

app.get('/api/tickets/my', authenticate, async (req, res) => {
  const userId = Number(req.user?.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }  try {
    const result = await pool.query(
      `SELECT t.*, p.status as payment_status, p.transaction_id, p.payment_method
       FROM tickets t
       LEFT JOIN payments p ON p.ticket_id = t.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching user tickets:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/tickets/user/:userId', authenticate, async (req, res) => {
  const userId = parseInt(req.params.userId);

  try {
    const result = await pool.query(`
      SELECT t.*, p.status as payment_status, p.payment_method, p.transaction_id
      FROM tickets t
      LEFT JOIN payments p ON t.id = p.ticket_id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `, [userId]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching user tickets:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Récupérer un ticket par ID (pour le paiement)
app.get('/api/tickets/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id);
  try {
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching ticket by ID:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  const ticketId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);

  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    const result = await pool.query(
      'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Remplacez la partie problématique dans la route /api/tickets/purchase
app.post('/api/tickets/purchase', authenticate, async (req, res) => {
  const { event_id, payment_method, card_number, expiry, cvv } = req.body;

  if (!event_id || !payment_method) {
    return res.status(400).json({ message: 'Event ID and payment method are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('Attempting to check event availability');
    
    // Récupération des informations de l'événement
    const eventResponse = await axios.get(`${eventsServiceUrl}/api/events/${event_id}`);
    const event = eventResponse.data;
    console.log('Event details:', event);
    
    // Requête modifiée: nous n'utilisons pas FOR UPDATE avec COUNT()
    // Au lieu de cela, nous comptons simplement les tickets vendus
    const ticketCountResult = await client.query(
      `SELECT COUNT(*) as sold 
       FROM tickets 
       WHERE event_id = $1 AND status != $2`,
      [event_id, 'cancelled']
    );
    
    const soldTickets = parseInt(ticketCountResult.rows[0].sold);
    console.log(`Sold tickets for event ${event_id}: ${soldTickets}`);
    
    const availableSeats = event.total_seats - soldTickets;
    console.log('Available seats:', availableSeats);

    if (availableSeats <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No tickets available for this event' });
    }

    // Créer un ticket réservé
    const ticketNumber = generateTicketNumber();
    console.log('Generated ticket number:', ticketNumber);
    
    const ticketResult = await client.query(
      `INSERT INTO tickets (ticket_number, event_id, user_id, status, price) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [ticketNumber, event_id, req.user.userId, 'reserved', event.price]
    );
    const ticket = ticketResult.rows[0];
    console.log('Ticket created:', ticket);

    // Simuler le paiement
    console.log('Processing payment for ticket:', ticket.id);
    const transactionId = `TRX-${uuidv4()}`;
    const paymentResult = await client.query(
      `INSERT INTO payments (ticket_id, amount, payment_method, transaction_id, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [ticket.id, event.price, payment_method, transactionId, 'completed']
    );

    console.log('Payment processed successfully, updating ticket status');
    await client.query(
      'UPDATE tickets SET status = $1 WHERE id = $2',
      ['confirmed', ticket.id]
    );

    await client.query('COMMIT');

    // Envoi de notification (non-bloquante)
    try {
      console.log('Sending notification...');
      await axios.post(`${notificationsServiceUrl}/api/notifications`, {
        user_id: req.user.userId,
        type: 'ticket_purchase',
        data: {
          ticket_id: ticket.id,
          ticket_number: ticketNumber,
          event_name: event.title,
          event_date: event.event_date,
          price: event.price
        }
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }

    // Réponse finale après un achat réussi
    res.status(201).json({
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        event_id: ticket.event_id,
        status: 'confirmed',
        price: ticket.price,
        purchase_date: ticket.purchase_date
      },
      payment: {
        transaction_id: transactionId,
        status: 'completed',
        payment_method
      },
      event
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during ticket purchase:', err);
    res.status(500).json({ 
      message: 'Error processing ticket purchase', 
      error: err.message,
      stack: err.stack
    });
  } finally {
    client.release();
  }
});

// Start server
initDb().then(() => {
  setupSwagger(app);

  app.listen(port, () => {
    console.log(`Tickets service running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to start Tickets service:', err);
});
