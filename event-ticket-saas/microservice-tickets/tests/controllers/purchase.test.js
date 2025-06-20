// tests/controllers/purchase.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../mocks/mockDb');

jest.mock('pg', () => require('../mocks/mockDb'));

describe('Purchase Tickets API', () => {
  beforeEach(() => {
    db.reset();
  });

  it('should purchase a ticket successfully', async () => {
    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ userId: 1, eventId: 100, quantity: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Purchase successful');
  });

  it('should fail to purchase if not enough tickets available', async () => {
    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ userId: 1, eventId: 999, quantity: 10 }); // Event 999 = low stock

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Not enough tickets available');
  });

  it('should reject purchase with missing fields', async () => {
    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ userId: 1 }); // missing eventId and quantity

    expect(res.statusCode).toBe(400);
  });

  it('should prevent duplicate purchases for same event and user', async () => {
    await request(app)
      .post('/api/tickets/purchase')
      .send({ userId: 1, eventId: 300, quantity: 1 });

    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ userId: 1, eventId: 300, quantity: 1 });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('Ticket already purchased');
  });
});
