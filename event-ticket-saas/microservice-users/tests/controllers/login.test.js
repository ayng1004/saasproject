// tests/controllers/login.test.js
const request = require('supertest');
const { app } = require('../../src/app');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

jest.mock('pg');

describe('POST /api/users/login', () => {
  let mPool;

  beforeAll(() => {
    mPool = new Pool();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email or password is missing', async () => {
    // Manque email et password
    const res = await request(app)
      .post('/api/users/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email and password are required');
  });

  it('should return 401 if user does not exist', async () => {
    // Simule la DB qui ne trouve aucun user
    mPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'test123',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should return 401 if password is incorrect', async () => {
    // Simule un user trouvé
    mPool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'User',
      }],
      rowCount: 1,
    });
    // Mock bcrypt.compare pour simuler un mot de passe invalide
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpass',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should login successfully with valid credentials', async () => {
    // Simule un user trouvé
    mPool.query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        first_name: 'Test',
        last_name: 'User',
        role: 'User',
      }],
      rowCount: 1,
    });
    // Mock bcrypt.compare pour simuler un mot de passe correct
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'test123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('test@example.com');
    // etc. (tu peux vérifier la forme du token, la role user, etc.)
  });
});
