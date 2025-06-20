// microservice-notifications/src/index.js - Ajout de fonctionnalités avancées
console.log('Notifications microservice starting...');
const setupSwagger = require('./swagger');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const morgan = require('morgan');
const Redis = require('ioredis');

const app = express();
const port = process.env.PORT || 4004;



/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API de notifications utilisateurs
 *
 * /health:
 *   get:
 *     summary: Vérifie la santé du microservice
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Service OK
 *
 * /api/notifications:
 *   get:
 *     summary: Récupérer toutes les notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Liste des notifications
 *
 *   post:
 *     summary: Créer une notification à partir d’un template
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - type
 *               - data
 *             properties:
 *               user_id:
 *                 type: integer
 *               type:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification ajoutée dans la queue
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur serveur
 */

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'notifications_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
});

// Redis connection for queues
const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
});

// Database initialization
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default templates if they don't exist
    const templates = [
      {
        name: 'ticket_purchase',
        subject: 'Confirmation de votre achat de billet',
        content: 'Bonjour {{firstName}},\n\nNous vous confirmons l\'achat de votre billet pour l\'événement "{{eventName}}".\n\nVotre numéro de billet est: {{ticketNumber}}\n\nDate de l\'événement: {{eventDate}}\n\nMerci pour votre achat!'
      },
      {
        name: 'event_reminder',
        subject: 'Rappel: Événement à venir',
        content: 'Bonjour {{firstName}},\n\nNous vous rappelons que l\'événement "{{eventName}}" auquel vous participez aura lieu le {{eventDate}}.\n\nAu plaisir de vous y voir!'
      }
    ];
    
    for (const template of templates) {
      await client.query(
        'INSERT INTO notification_templates (name, subject, content) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [template.name, template.subject, template.content]
      );
    }
    
    console.log('Notifications database tables initialized');
  } catch (err) {
    console.error('Error initializing database', err);
  } finally {
    client.release();
  }
};

// Template processing function
const processTemplate = (template, data) => {
  let processedTemplate = template;
  
  // Replace all placeholders with actual data
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(placeholder, data[key]);
  });
  
  return processedTemplate;
};

// Process notifications from the queue
const processNotificationQueue = async () => {
  try {
    // Get a notification from the queue
    const notificationId = await redis.lpop('notification_queue');
    
    if (!notificationId) {
      return; // No notifications in the queue
    }
    
    console.log(`Processing notification id: ${notificationId}`);
    
    // Get notification details from the database
    const notificationResult = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND status = $2',
      [notificationId, 'pending']
    );
    
    if (notificationResult.rows.length === 0) {
      console.log(`Notification ${notificationId} not found or not pending`);
      return;
    }
    
    const notification = notificationResult.rows[0];
    
    // Simulate sending a notification
    console.log(`Sending notification to user ${notification.user_id}: ${notification.type}`);
    console.log(`Content: ${notification.content}`);
    
    // Update the notification status in the database
    await pool.query(
      'UPDATE notifications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['sent', notification.id]
    );
    
    console.log(`Notification ${notificationId} marked as sent`);
    
  } catch (error) {
    console.error('Error processing notification queue:', error);
  }
};

// Set up a notification queue processor
const startQueueProcessor = () => {
  // Process the queue every 2 seconds
  setInterval(processNotificationQueue, 2000);
  console.log('Notification queue processor started');
};

// Routes

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'notifications-service' });
});

// Create a new notification
app.post('/api/notifications', async (req, res) => {
  console.log("Notification reçue:", req.body); 

  const { user_id, type, data } = req.body;
  
  if (!user_id || !type || !data) {
    return res.status(400).json({ message: 'User ID, notification type, and data are required' });
  }
  
  const client = await pool.connect();
  
  try {
    // Get the template for this notification type
    const templateResult = await client.query(
      'SELECT * FROM notification_templates WHERE name = $1',
      [type]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(400).json({ message: `No template found for notification type: ${type}` });
    }
    
    const template = templateResult.rows[0];
    
    // Prepare the notification content
    const notificationData = {
      firstName: data.firstName || 'User',  // Default value if not provided
      ...data
    };
    
    const content = processTemplate(template.content, notificationData);
    
    // Create the notification in the database
    const notificationResult = await client.query(
      'INSERT INTO notifications (user_id, type, content, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, type, content, 'pending']
    );
    
    const notificationId = notificationResult.rows[0].id;
    
    // Add the notification to the processing queue
    await redis.rpush('notification_queue', notificationId);
    
    res.status(201).json({ 
      message: 'Notification queued successfully',
      notification_id: notificationId
    });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get all notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
initDb().then(() => {
  setupSwagger(app);
  app.listen(port, () => {
    console.log(`Notifications service running on port ${port}`);
    // Start the notification queue processor
    startQueueProcessor();
  });
}).catch(err => {
  console.error('Failed to start Notifications service:', err);
});