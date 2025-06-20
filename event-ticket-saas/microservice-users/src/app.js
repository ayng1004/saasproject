// microservice-users/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const swaggerConfig = require('./swagger');

// On crée ici l'application Express sans lancer de .listen()
const app = express();

// Middlewares globaux
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Documentation Swagger
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Route redirigeant vers la documentation
app.get('/api', (req, res) => {
  res.redirect('/api-docs');
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'users_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
});

// Middlewares d'authentification/autorisation
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
    console.log('Received token:', token); // Ajoute ceci pour vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err); // Affiche l'erreur pour aider au débogage
    return res.status(401).json({ message: 'Invalid token' });
  }
};

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

// ------------------- Routes -------------------

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Points de terminaison de vérification de l'état du service
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Gestion de l'authentification
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestion des utilisateurs
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifier l'état du service
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service en ligne
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 */
// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'users-service' });
});

/**
 * @swagger
 * /api/users/health:
 *   get:
 *     summary: Vérifier l'état du service utilisateurs
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service en ligne
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 container:
 *                   type: string
 */
app.get('/api/users/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'users-service',
    container: process.env.HOSTNAME || 'unknown'
  });
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin, EventCreator, User]
 *                 default: User
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 */
// Register User
app.post('/api/users/register', async (req, res) => {
  const { email, password, first_name, last_name, role = 'User' } = req.body;
  // Validation
  if (!email || !password || !first_name || !last_name) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  // Validate role
  const validRoles = ['Admin', 'EventCreator', 'User'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    // Check if user already exists
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
      [email, hashedPassword, first_name, last_name, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authentifier un utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */
// Login
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur actuel
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Get Current User
app.get('/api/users/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, role FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Mettre à jour un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Admin, EventCreator, User]
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Update User
app.put('/api/users/:id', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (req.user.role !== 'Admin' && req.user.userId !== userId) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { email, first_name, last_name, role } = req.body;
  if (role && req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Not authorized to change role' });
  }
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    let query = 'UPDATE users SET ';
    const values = [];
    let valueIndex = 1;
    if (email) {
      query += `email = $${valueIndex}, `;
      values.push(email);
      valueIndex++;
    }
    if (first_name) {
      query += `first_name = $${valueIndex}, `;
      values.push(first_name);
      valueIndex++;
    }
    if (last_name) {
      query += `last_name = $${valueIndex}, `;
      values.push(last_name);
      valueIndex++;
    }
    if (role && req.user.role === 'Admin') {
      query += `role = $${valueIndex}, `;
      values.push(role);
      valueIndex++;
    }
    if (values.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    query = query.slice(0, -2); // Remove trailing comma and space
    query += ` WHERE id = $${valueIndex} RETURNING id, email, first_name, last_name, role`;
    values.push(userId);
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}/change-password:
 *   put:
 *     summary: Changer le mot de passe d'un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *               new_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Mot de passe actuel incorrect
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Change Password
app.put('/api/users/:id/change-password', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (req.user.userId !== userId) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Delete User
app.delete('/api/users/:id', authenticate, authorize(['Admin']), async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtenir tous les utilisateurs (Admin uniquement)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
// Get All Users (Admin only)
app.get('/api/users', authenticate, authorize(['Admin']), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
// Get User by ID
app.get('/api/users/:id', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id);
  if (req.user.role !== 'Admin' && req.user.userId !== userId) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = {
  app,
  pool,
  authenticate,
  authorize // si besoin de l'exporter
};