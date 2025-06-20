console.log('API Gateway starting...');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Buffer } = require('buffer');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const bodyParser = require('body-parser');

const attachRawBody = (req, res, buf) => {
  req.rawBody = buf;
};

app.use(bodyParser.json({ verify: attachRawBody }));
app.use(bodyParser.urlencoded({ extended: true, verify: attachRawBody }));



app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(morgan('combined'));

// URLs des microservices
const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://users-service:4001';
const eventsServiceUrl = process.env.EVENTS_SERVICE_URL || 'http://events-service:4002';
const ticketsServiceUrl = process.env.TICKETS_SERVICE_URL || 'http://tickets-service:4003';

// Limitation de requêtes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// Vérification optionnelle du JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
    req.user = decoded;
    next();
  } catch {
    next(); // On laisse le microservice gérer l’erreur
  }
};

// Proxy avec corps transmis manuellement
const proxyWithBody = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    if (req.rawBody) {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(req.rawBody));
      proxyReq.write(req.rawBody);
    }
  }
  
});

// Routes proxies
app.use('/api/users', verifyToken, proxyWithBody(usersServiceUrl));
app.use('/api/events', verifyToken, proxyWithBody(eventsServiceUrl));
app.use('/api/tickets', verifyToken, proxyWithBody(ticketsServiceUrl));

// Route par défaut
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'api-gateway' });
});
app.use('/', (req, res) => {
  res.json({ message: 'Event Ticket SaaS API Gateway' });
});

app.listen(port, host, () => {
  console.log(`API Gateway running on http://${host}:${port}`);
});
