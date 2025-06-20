// test.js
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Définir un secret JWT fixe pour les tests
const JWT_SECRET = 'test_secret_123';

// Créer un token de test
const testToken = jwt.sign(
  { userId: 999, role: 'Admin' }, 
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Token de test à utiliser:', testToken);
console.log('Format complet: Authorization: Bearer ' + testToken);

// Middleware d'authentification très simple
const authenticate = (req, res, next) => {
  console.log('Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token missing' });
  }
  
  try {
    console.log('Vérification avec secret:', JWT_SECRET);
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token décodé:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erreur JWT:', err);
    return res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

// Route de test
app.post('/test-auth', authenticate, (req, res) => {
  res.json({ 
    message: 'Authentification réussie!',
    user: req.user
  });
});

// Démarrer le serveur
// Modifie cette ligne pour utiliser un autre port
const PORT = 4500; // ou n'importe quel port disponible
app.listen(PORT, () => {
  console.log(`Serveur de test démarré sur http://localhost:${PORT}`);
});