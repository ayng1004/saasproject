const express = require('express');
const app = express();
const setupSwagger = require('./swagger');
// === Mock DB ===
const mockDb = require('../tests/mocks/mockDb');
const { __mockData } = mockDb;



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

// Middleware mock d'authentification
const mockAuthenticate = (req, res, next) => {
  req.user = { userId: 1 }; // utilisateur fictif
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'tickets-service'
  });
});

// Créer un ticket
app.post('/api/tickets', (req, res) => {
  const { eventId, price, quantity } = req.body;

  if (!eventId || !price || !quantity) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  __mockData.events[eventId] = {
    id: eventId,
    price,
    available: quantity
  };

  return res.status(201).json({ message: 'Ticket created' });
});

// Lister tous les tickets
app.get('/api/tickets', (req, res) => {
  return res.status(200).json(Object.values(__mockData.events));
});

// Récupérer un ticket par ID
app.get('/api/tickets/:id', (req, res) => {
  const ticket = __mockData.events[req.params.id];

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  return res.status(200).json(ticket);
});

// Acheter un ticket
app.post('/api/tickets/purchase', mockAuthenticate, (req, res) => {
  const { eventId, quantity } = req.body;
  const userId = req.user.userId;

  if (!eventId || !quantity) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const event = __mockData.events[eventId];
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const alreadyPurchased = __mockData.purchases.find(
    (p) => p.userId === userId && p.eventId === eventId
  );

  if (alreadyPurchased) {
    return res.status(409).json({ error: 'Ticket already purchased' });
  }

  if (event.available < quantity) {
    return res.status(400).json({ error: 'Not enough tickets available' });
  }

  event.available -= quantity;
  __mockData.purchases.push({ userId, eventId, quantity });

  return res.status(200).json({ message: 'Purchase successful' });
});


  // Voir tous les tickets achetés par un utilisateur
app.get('/api/tickets/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);

  const userPurchases = __mockData.purchases
    .filter(p => p.userId === userId)
    .map(p => {
      const event = __mockData.events[p.eventId];
      return {
        eventId: p.eventId,
        eventName: event?.name || 'Unknown Event',
        quantity: p.quantity,
        price: event?.price || 0,
      };
    });

  return res.json({ userId, purchases: userPurchases });
});
setupSwagger(app);

module.exports = app;
