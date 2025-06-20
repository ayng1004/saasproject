// single-file-app.js - Une application autonome pour tester et identifier le problème
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const { Pool } = require('pg');

// Secret JWT fixe
const JWT_SECRET = 'test_secret_123';

// Création de l'application
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

// Authentification simple
const authenticate = (req, res, next) => {
  console.log('===== AUTHENTICATION DEBUGGING =====');
  console.log('Headers:', JSON.stringify(req.headers));
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Pas d\'en-tête d\'autorisation');
    return res.status(401).json({ message: 'Authorization header is required' });
  }
  
  console.log('Auth header:', authHeader);
  const parts = authHeader.split(' ');
  console.log('Parts:', parts);
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('Format d\'en-tête incorrect');
    return res.status(401).json({ message: 'Authorization format should be: Bearer [token]' });
  }
  
  const token = parts[1];
  console.log('Token:', token);
  
  try {
    // Décode sans vérifier pour voir le contenu
    const decodedWithoutVerify = jwt.decode(token);
    console.log('Contenu du token (sans vérification):', decodedWithoutVerify);
    
    // Vérifie avec le secret
    console.log('Vérification avec secret:', JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token vérifié avec succès:', decoded);
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erreur JWT:', err.name, '-', err.message);
    return res.status(401).json({ 
      message: 'Invalid token', 
      error: err.message,
      errorType: err.name
    });
  }
};

// Route de test d'authentification
app.post('/api/test-auth', authenticate, (req, res) => {
  res.json({ 
    message: 'Authentification réussie!',
    user: req.user
  });
});

// Route de génération de token (pour tester)
app.get('/generate-token', (req, res) => {
  const testToken = jwt.sign(
    { userId: 999, role: 'Admin' }, 
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({
    token: testToken,
    authHeader: `Bearer ${testToken}`,
    message: 'Utilise ce token pour tester l\'authentification'
  });
});

// Route protégée simplifiée
app.post('/api/events', authenticate, (req, res) => {
  // Version simplifiée sans DB
  console.log('Création d\'événement avec utilisateur:', req.user);
  console.log('Données d\'événement:', req.body);
  
  res.status(201).json({
    message: 'Event would be created (this is a test)',
    createdBy: req.user,
    eventData: req.body
  });
});

// Démarrage du serveur
const PORT = 4500;
app.listen(PORT, () => {
  console.log(`Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`Visite http://localhost:${PORT}/generate-token pour créer un token de test`);
});