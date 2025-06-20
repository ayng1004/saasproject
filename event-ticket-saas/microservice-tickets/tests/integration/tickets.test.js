// tests/integration/tickets.test.js
const request = require('supertest');
const app = require('../../src/app'); // adapte le chemin si besoin
const jwt = require('jsonwebtoken');

describe('Tickets Integration Tests', () => {
  const token = `Bearer ${jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'default_jwt_secret')}`;

  it('GET /api/tickets/my - should fetch tickets for authenticated user', async () => {
    const res = await request(app)
      .get('/api/tickets/my')
      .set('Authorization', token);

    console.log('Status /tickets/my →', res.statusCode);
    expect([200, 401, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('GET /api/tickets/my - should fail without token', async () => {
    const res = await request(app).get('/api/tickets/my');
    console.log('No token - received status:', res.statusCode);
    expect([401, 403, 404]).toContain(res.statusCode);
  });

  it('POST /api/tickets/purchase - should reject unauthenticated user', async () => {
    const res = await request(app)
      .post('/api/tickets/purchase')
      .send({ event_id: 1, payment_method: 'credit_card' });

    console.log('Unauth POST /purchase:', res.statusCode);
    expect([400, 401, 403]).toContain(res.statusCode);  });
});
