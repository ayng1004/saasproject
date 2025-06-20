const request = require('supertest');  // Ajout de l'import de supertest
const { app } = require('../../src/app');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');  // Ajout de l'import de jsonwebtoken

// Mock de la connexion à la base de données
jest.mock('pg', () => {
    const mockPool = {
      connect: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn(),
      }),
      query: jest.fn(),
      end: jest.fn(),
    };
    return { Pool: jest.fn(() => mockPool) };
  });
  
  // Mock de jsonwebtoken
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('fake_token'),
    verify: jest.fn(), // Sera configuré dans chaque test
  }));
  
  describe('GET /api/users/me', () => {
    let pool;
  
    beforeEach(() => {
      jest.clearAllMocks();
      pool = require('pg').Pool();
      
      // Réinitialiser les mocks avec les valeurs par défaut
      jwt.verify.mockImplementation(() => ({ userId: 1, email: 'test@example.com', role: 'User' }));
    });
  
    it('should return 401 if token is missing', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .send();
        
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authorization header is required');
    });
  
    it('should return 401 if token is invalid', async () => {
      // Simuler une erreur de vérification du token
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
  
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid_token')
        .send();
        
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid token');
    });
  
    it('should return 404 if user does not exist in DB', async () => {
      // Configurer jwt.verify pour simuler un utilisateur authentifié
      jwt.verify.mockReturnValueOnce({ userId: 999, email: 'ghost@example.com', role: 'User' });
      
      // Simuler aucun utilisateur trouvé
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
  
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake_token');
  
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  
    it('should return user info if token is valid and user exists', async () => {
      // Configurer jwt.verify pour simuler un utilisateur authentifié
      jwt.verify.mockReturnValueOnce({ userId: 1, email: 'test@example.com', role: 'User' });
      
      // Simuler l'utilisateur trouvé
      pool.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'User',
          },
        ],
        rowCount: 1,
      });
  
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer fake_token');
  
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.role).toBe('User');
    });
  });