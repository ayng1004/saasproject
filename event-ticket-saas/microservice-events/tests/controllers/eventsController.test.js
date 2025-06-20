const request = require('supertest');
const { app } = require('../../src/app');
const jwt = require('jsonwebtoken');
const { mockQuery } = require('../mocks/mockDb');

describe('Events Controller', () => {
  const token = jwt.sign({ userId: 1, role: 'EventCreator' }, 'default_jwt_secret');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app).post('/api/events').send({});
    expect(res.status).toBe(401);
  });

  it('should create a new event if authorized and data valid', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // Insert event
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Find category
      .mockResolvedValueOnce({}); // Insert mapping

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Event',
        description: 'A fun test',
        location: 'Online',
        event_date: new Date().toISOString(),
        total_seats: 50,
        price: 19.99,
        categories: ['Workshop'],
      });

    expect(res.status).toBe(201);
    expect(mockQuery).toHaveBeenCalled();
  });
});
