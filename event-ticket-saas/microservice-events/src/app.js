// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const setupSwagger = require('./swagger');

const app = express();





/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API pour gérer les événements

 * @swagger
 * /health:
 *   get:
 *     summary: Vérifie l’état du service
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Service OK

 * @swagger
 * /api/events/categories:
 *   get:
 *     summary: Liste toutes les catégories d’événements
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Liste des catégories

 * @swagger
 * /api/events:
 *   get:
 *     summary: Liste tous les événements (avec filtres possibles)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrer par nom de catégorie
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtrer par localisation
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Date minimale (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Date maximale (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Liste des événements

 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Récupère un événement par ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l’événement
 *     responses:
 *       200:
 *         description: Détail de l’événement
 *       404:
 *         description: Événement introuvable

 * @swagger
 * /api/events:
 *   post:
 *     summary: Crée un nouvel événement
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - event_date
 *               - total_seats
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               event_date:
 *                 type: string
 *                 format: date-time
 *               total_seats:
 *                 type: integer
 *               price:
 *                 type: number
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Événement créé avec succès
 *       400:
 *         description: Champs manquants
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */







// Middleware globaux
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Connexion à la base PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'events_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
});

// Middleware d'authentification
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is required' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware d'autorisation
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    next();
  };
};

// Routes HTTP

// Vérification de l'état du service
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'events-service' });
  });
  
  // Récupérer toutes les catégories d'événements
  app.get('/api/events/categories', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM event_categories ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Récupérer tous les événements (avec filtres possibles)
  app.get('/api/events', async (req, res) => {
    try {
      let query = `
        SELECT e.*, array_agg(ec.name) as categories 
        FROM events e
        LEFT JOIN event_category_mapping ecm ON e.id = ecm.event_id
        LEFT JOIN event_categories ec ON ecm.category_id = ec.id
      `;
      
      const queryParams = [];
      const conditions = [];
      
      // Appliquer les filtres si fournis dans la requête
      if (req.query.category) {
        conditions.push('ec.name = $' + (queryParams.length + 1));
        queryParams.push(req.query.category);
      }
      
      if (req.query.location) {
        conditions.push('e.location ILIKE $' + (queryParams.length + 1));
        queryParams.push(`%${req.query.location}%`);
      }
      
      if (req.query.date_from) {
        conditions.push('e.event_date >= $' + (queryParams.length + 1));
        queryParams.push(req.query.date_from);
      }
      
      if (req.query.date_to) {
        conditions.push('e.event_date <= $' + (queryParams.length + 1));
        queryParams.push(req.query.date_to);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' GROUP BY e.id ORDER BY e.event_date';
      
      const result = await pool.query(query, queryParams);
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Récupérer un événement par son ID
  app.get('/api/events/:id', async (req, res) => {
    const eventId = parseInt(req.params.id);
    
    try {
      const query = `
        SELECT e.*, array_agg(ec.name) as categories 
        FROM events e
        LEFT JOIN event_category_mapping ecm ON e.id = ecm.event_id
        LEFT JOIN event_categories ec ON ecm.category_id = ec.id
        WHERE e.id = $1
        GROUP BY e.id
      `;
      
      const result = await pool.query(query, [eventId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching event:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Créer un événement (seulement pour Admin et EventCreator)
  app.post('/api/events', authenticate, authorize(['Admin', 'EventCreator']), async (req, res) => {
    const { title, description, location, event_date, total_seats, price, categories } = req.body;
    
    // Validation des champs nécessaires
    if (!title || !location || !event_date || !total_seats || !price) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Créer l'événement
      const eventResult = await client.query(
        `INSERT INTO events 
          (title, description, location, event_date, total_seats, price, creator_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [title, description, location, event_date, total_seats, price, req.user.userId]
      );
      
      const event = eventResult.rows[0];
      
      // Ajouter les catégories
      if (categories && categories.length > 0) {
        for (const categoryName of categories) {
          const categoryResult = await client.query(
            'SELECT id FROM event_categories WHERE name = $1',
            [categoryName]
          );
          
          let categoryId;
          
          if (categoryResult.rows.length > 0) {
            categoryId = categoryResult.rows[0].id;
          } else {
            const newCategoryResult = await client.query(
              'INSERT INTO event_categories (name) VALUES ($1) RETURNING id',
              [categoryName]
            );
            categoryId = newCategoryResult.rows[0].id;
          }
          
          // Lier l'événement à la catégorie
          await client.query(
            'INSERT INTO event_category_mapping (event_id, category_id) VALUES ($1, $2)',
            [event.id, categoryId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      // Récupérer l'événement complet avec ses catégories
      const completeEventResult = await client.query(
        `SELECT e.*, array_agg(ec.name) as categories 
        FROM events e
        LEFT JOIN event_category_mapping ecm ON e.id = ecm.event_id
        LEFT JOIN event_categories ec ON ecm.category_id = ec.id
        WHERE e.id = $1
        GROUP BY e.id`,
        [event.id]
      );
      
      res.status(201).json(completeEventResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating event:', err);
      res.status(500).json({ message: 'Internal server error' });
    } finally {
      client.release();
    }
  });

  
// Swagger documentation setup
setupSwagger(app);

  
module.exports = {
  app,
  pool,
  authenticate,
  authorize
};