// authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('./app');

const router = express.Router();

// Configuration du limiteur de débit pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite chaque IP à 5 requêtes par fenêtre de 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
  },
  keyGenerator: (req) => {
    // Utiliser l'adresse IP et l'email pour limiter les tentatives
    return `${req.ip}-${req.body.email}`;
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validation basique
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  try {
    // Vérifier si l'email existe déjà
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    
    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Créer l'utilisateur
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'User'] // Rôle par défaut : User
    );
    
    const user = result.rows[0];
    
    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Authentifier un utilisateur
 *     description: Connecte un utilisateur et renvoie un token JWT
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
 *       401:
 *         description: Identifiants invalides
 *       429:
 *         description: Trop de tentatives
 *       500:
 *         description: Erreur serveur
 */
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  
  // Validation basique
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Vérifier si l'utilisateur existe
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;