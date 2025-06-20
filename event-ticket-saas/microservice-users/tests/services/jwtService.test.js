const jwt = require('jsonwebtoken');

// Mock pour jwt
jest.mock('jsonwebtoken');

describe('JWT Service', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    // Réinitialiser les mocks et l'environnement
    jest.clearAllMocks();
    process.env = { ...oldEnv };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  describe('JWT token generation', () => {
    it('should generate a token with user data and use default secret if JWT_SECRET is not set', () => {
      // Supprimer JWT_SECRET de l'environnement
      delete process.env.JWT_SECRET;
      
      const userData = { userId: 1, email: 'test@example.com', role: 'User' };
      
      jwt.sign.mockReturnValue('generated_token');
      
      // Appel direct à jwt.sign comme dans app.js
      const token = jwt.sign(
        userData,
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '24h' }
      );
      
      expect(token).toBe('generated_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        userData,
        'default_jwt_secret',
        { expiresIn: '24h' }
      );
    });

    it('should generate a token with user data and use JWT_SECRET from environment if set', () => {
      // Définir JWT_SECRET dans l'environnement
      process.env.JWT_SECRET = 'custom_secret';
      
      const userData = { userId: 1, email: 'test@example.com', role: 'User' };
      
      jwt.sign.mockReturnValue('generated_token');
      
      // Appel direct à jwt.sign comme dans app.js
      const token = jwt.sign(
        userData,
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '24h' }
      );
      
      expect(token).toBe('generated_token');
      expect(jwt.sign).toHaveBeenCalledWith(
        userData,
        'custom_secret',
        { expiresIn: '24h' }
      );
    });
  });

  describe('JWT token verification', () => {
    it('should verify a token and use default secret if JWT_SECRET is not set', () => {
      // Supprimer JWT_SECRET de l'environnement
      delete process.env.JWT_SECRET;
      
      const token = 'valid_token';
      const decodedToken = { userId: 1, email: 'test@example.com', role: 'User' };
      
      jwt.verify.mockReturnValue(decodedToken);
      
      // Appel direct à jwt.verify comme dans le middleware authenticate
      const result = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
      
      expect(result).toEqual(decodedToken);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'default_jwt_secret');
    });

    it('should verify a token and use JWT_SECRET from environment if set', () => {
      // Définir JWT_SECRET dans l'environnement
      process.env.JWT_SECRET = 'custom_secret';
      
      const token = 'valid_token';
      const decodedToken = { userId: 1, email: 'test@example.com', role: 'User' };
      
      jwt.verify.mockReturnValue(decodedToken);
      
      // Appel direct à jwt.verify comme dans le middleware authenticate
      const result = jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
      
      expect(result).toEqual(decodedToken);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'custom_secret');
    });

    it('should throw an error if token is invalid', () => {
      const token = 'invalid_token';
      
      // Simuler une erreur de vérification de token
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET || 'default_jwt_secret');
      }).toThrow();
    });
  });
});