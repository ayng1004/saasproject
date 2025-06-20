const jwt = require('jsonwebtoken');
const { app } = require('../../src/app');

// Mock pour jwt
jest.mock('jsonwebtoken');

describe('Authenticate Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();

    // Créer des objets mock pour req, res et next
    req = {
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  // Extraire le middleware d'authentification directement depuis l'app
  const extractAuthenticateMiddleware = () => {
    // Trouver la route qui utilise le middleware authenticate
    const route = app._router.stack.find(
      layer => layer.route && layer.route.path === '/api/users/me'
    );
    
    if (!route) {
      throw new Error('Route /api/users/me not found');
    }
    
    // Le premier middleware de cette route devrait être authenticate
    return route.route.stack[0].handle;
  };

  // Tests
  it('should return 401 if no authorization header is provided', () => {
    const authenticate = extractAuthenticateMiddleware();
    authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authorization header is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not contain a token', () => {
    req.headers.authorization = 'Bearer ';
    
    const authenticate = extractAuthenticateMiddleware();
    authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Authentication token is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalid_token';
    
    // Simuler une erreur de vérification de token
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    const authenticate = extractAuthenticateMiddleware();
    authenticate(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should set req.user and call next() if token is valid', () => {
    req.headers.authorization = 'Bearer valid_token';
    
    const decodedToken = { userId: 1, email: 'test@example.com', role: 'User' };
    
    // Simuler une vérification de token réussie
    jwt.verify.mockReturnValue(decodedToken);
    
    const authenticate = extractAuthenticateMiddleware();
    authenticate(req, res, next);
    
    expect(req.user).toEqual(decodedToken);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});