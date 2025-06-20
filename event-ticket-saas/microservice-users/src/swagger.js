
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Options de configuration Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Microservice Users',
      version: '1.0.0',
      description: 'Documentation de l\'API du microservice de gestion des utilisateurs',
    },
    servers: [
      {
        url: 'http://localhost:4001',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password', 'first_name', 'last_name'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID unique de l\'utilisateur',
            },
            email: {
              type: 'string',
              description: 'Email de l\'utilisateur',
            },
            password: {
              type: 'string',
              description: 'Mot de passe de l\'utilisateur (haché)',
              writeOnly: true,
            },
            first_name: {
              type: 'string',
              description: 'Prénom de l\'utilisateur',
            },
            last_name: {
              type: 'string',
              description: 'Nom de l\'utilisateur',
            },
            role: {
              type: 'string',
              enum: ['Admin', 'EventCreator', 'User'],
              description: 'Rôle de l\'utilisateur',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de mise à jour',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Message d\'erreur',
            },
          },
        },
      },
    },
  },
  apis: ['./src/app.js'], // Chemins des fichiers contenant les commentaires de documentation
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs),
  specs,
};