// tests/controllers/tickets.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../mocks/mockDb');

jest.mock('pg', () => require('../mocks/mockDb'));

describe('Tickets API', () => {
  beforeEach(() => {
    db.reset();
  });

  it('should create a new ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ eventId: 200, price: 25, quantity: 100 });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Ticket created');
  });

  it('should return all tickets', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return a ticket by ID', async () => {
    // Crée un ticket d'abord
    await request(app)
      .post('/api/tickets')
      .send({ eventId: 42, price: 10, quantity: 50 });
  
    const res = await request(app).get('/api/tickets/42');
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(42); // eventId === 42
  });
  

  it('should return 404 if ticket not found', async () => {
    const res = await request(app).get('/api/tickets/9999');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Ticket not found');
  });
});
