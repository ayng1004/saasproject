const request = require('supertest');
const app = require('../../src/app');

describe('GET /health', () => {
  it('should return status 200 and service info', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'tickets-service'
    });
  });
});
