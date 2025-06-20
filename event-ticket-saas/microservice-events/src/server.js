// server.js
require('dotenv').config();
const { app } = require('./app');
const authRoutes = require('./authRoutes');

// Définir le port
const PORT = process.env.PORT || 5000;

// Utiliser les routes d'authentification
app.use('/api/users', authRoutes);

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});