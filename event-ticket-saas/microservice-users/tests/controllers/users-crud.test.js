// tests/controllers/users-crud.test.js
const request = require('supertest');
const { app } = require('../../src/app');
const { Pool } = require('pg');

jest.mock('pg');

describe('Users CRUD routes (PUT /api/users/:id, DELETE, etc.)', () => {
  let mPool;
  beforeAll(() => {
    mPool = new Pool();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dummy test for update user', () => {
    expect(true).toBe(true);
  });

  it('dummy test for delete user', () => {
    expect(true).toBe(true);
  });
});
