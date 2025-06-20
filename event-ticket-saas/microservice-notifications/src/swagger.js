// swagger.js pour le microservice Notifications
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notifications Service API',
      version: '1.0.0',
      description: 'API de gestion des notifications utilisateurs'
    },
    servers: [
      {
        url: 'http://localhost:4004',
        description: 'Local server'
      }
    ]
  },
  apis: [__dirname + '/index.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
