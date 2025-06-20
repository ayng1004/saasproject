const request = require('supertest');
const { app } = require('../../src/app');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn(),
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('fake_token'),
  verify: jest.fn(), // Sera configuré dans chaque test
}));

describe('PUT /api/users/:id/change-password', () => {
  let pool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = require('pg').Pool();
    
    // Réinitialiser les mocks avec les valeurs par défaut
    jwt.verify.mockImplementation(() => ({ userId: 1, email: 'test@example.com', role: 'User' }));
    bcrypt.compare.mockResolvedValue(true);
  });

  it('should return 403 if user tries to change password of another user', async () => {
    // Configurer jwt.verify pour simuler un utilisateur authentifié
    jwt.verify.mockReturnValueOnce({ userId: 1, email: 'test@example.com', role: 'User' });

    const res = await request(app)
      .put('/api/users/2/change-password')
      .set('Authorization', 'Bearer fake_token')
      .send({ current_password: 'oldpass', new_password: 'newpass' });
      
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Not authorized');
  });

  it('should return 400 if current_password or new_password is missing', async () => {
    // Configurer jwt.verify pour simuler un utilisateur authentifié
    jwt.verify.mockReturnValueOnce({ userId: 1, email: 'test@example.com', role: 'User' });

    const res = await request(app)
      .put('/api/users/1/change-password')
      .set('Authorization', 'Bearer fake_token')
      .send({});
      
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Current password and new password are required');
  });

  it('should return 404 if user not found', async () => {
    // Configurer jwt.verify pour simuler un utilisateur authentifié
    jwt.verify.mockReturnValueOnce({ userId: 1, email: 'test@example.com', role: 'User' });
    
    // Simuler aucun utilisateur trouvé
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .put('/api/users/1/change-password')
      .set('Authorization', 'Bearer fake_token')
      .send({
        current_password: 'oldpass',
        new_password: 'newpass',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('User not found');
  });

  it('should return 401 if current password is incorrect', async () => {
    // Configurer jwt.verify pour simuler un utilisateur authentifié
    jwt.verify.mockReturnValueOnce({ userId: 1, email: 'test@example.com', role: 'User' });
    
    // Simuler l'utilisateur trouvé
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      }],
      rowCount: 1,
    });
    
    // Simuler une vérification de mot de passe échouée
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .put('/api/users/1/change-password')
      .set('Authorization', 'Bearer fake_token')
      .send({
        current_password: 'wrongOldPass',
        new_password: 'newpass',
      });
      
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Current password is incorrect');
  });

  it('should update password if current is correct', async () => {
    // Configurer jwt.verify pour simuler un utilisateur authentifié
    jwt.verify.mockReturnValueOnce({ userId: 1, email: 'test@example.com', role: 'User' });
    
    // Simuler l'utilisateur trouvé
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
      }],
      rowCount: 1,
    });
    
    // Simuler une vérification de mot de passe réussie
    bcrypt.compare.mockResolvedValueOnce(true);
    
    // Simuler la mise à jour du mot de passe
    pool.query.mockResolvedValueOnce({
      rowCount: 1,
    });

    const res = await request(app)
      .put('/api/users/1/change-password')
      .set('Authorization', 'Bearer fake_token')
      .send({
        current_password: 'oldpass',
        new_password: 'newpass',
      });
      
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password updated successfully');
  });
});