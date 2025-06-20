// tests/controllers/register.test.js
const request = require('supertest');
const { app } = require('../../src/app');
const { Pool } = require('pg');

jest.mock('pg');

describe('POST /api/users/register', () => {
  let mPool;

  beforeAll(() => {
    mPool = new Pool();  // Récupère le mock
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    // 1) Simule "user n’existe pas"
    mPool.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) 
      // 2) Simule l’insertion réussie
      .mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'User',
        }],
        rowCount: 1,
      });

    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'test123',
        first_name: 'Test',
        last_name: 'User',
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('test@example.com');
    expect(response.body.role).toBe('User');
  });

  it('should fail if user already exists', async () => {
    // Simule que l’utilisateur est déjà en base
    mPool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com' }],
      rowCount: 1,
    });

    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'test123',
        first_name: 'Test',
        last_name: 'User',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User already exists');
  });

  it('should fail if required fields are missing', async () => {
    // On ne simule pas la DB ici, car on attend un 400 direct
    const response = await request(app)
      .post('/api/users/register')
      .send({
        // Manque password, first_name, last_name
        email: 'incomplete@example.com',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('All fields are required');
  });

  it('should fail if role is invalid', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'role@example.com',
        password: 'test123',
        first_name: 'Role',
        last_name: 'User',
        role: 'RandomRole' // Non supporté
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid role');
  });
});
