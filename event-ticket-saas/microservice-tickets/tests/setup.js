// microservice-users/tests/setup.js

// On mocke le module 'pg' globalement pour tous les tests
jest.mock('pg', () => {
    const mClient = {
      connect: jest.fn(),
      query: jest.fn(),
      release: jest.fn(),
    };
    const mPool = {
      connect: jest.fn(() => Promise.resolve(mClient)),
      query: jest.fn(),
      end: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
  });
  
  // Tu peux aussi mettre d’autres mocks ici (ex: jest.mock('bcryptjs')...) si besoin
  
  jest.setTimeout(10000);
  