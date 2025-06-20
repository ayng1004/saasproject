const { app } = require('../../src/app');

describe('Authorize Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Réinitialiser et créer des objets mock pour req, res et next
    req = {};
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  // Extraire le middleware d'autorisation directement depuis l'app
  const extractAuthorizeMiddleware = () => {
    // Trouver la route qui utilise le middleware authorize pour les admins
    const route = app._router.stack.find(
      layer => layer.route && layer.route.path === '/api/users'
    );
    
    if (!route) {
      throw new Error('Route /api/users not found');
    }
    
    // Le deuxième middleware de cette route devrait être authorize(['Admin'])
    return route.route.stack[1].handle;
  };

  it('should return 401 if user is not authenticated (req.user is undefined)', () => {
    // req.user n'est pas défini
    const authorizeMiddleware = extractAuthorizeMiddleware();
    authorizeMiddleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not in allowed roles', () => {
    // L'utilisateur a le rôle 'User' mais seul 'Admin' est autorisé
    req.user = { role: 'User' };
    
    const authorizeMiddleware = extractAuthorizeMiddleware();
    authorizeMiddleware(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if user role is in allowed roles', () => {
    // L'utilisateur a le rôle 'Admin' et 'Admin' est autorisé
    req.user = { role: 'Admin' };
    
    const authorizeMiddleware = extractAuthorizeMiddleware();
    authorizeMiddleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});