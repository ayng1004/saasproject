// tests/mocks/mockDb.js
const mClient = {
  query: jest.fn(),
  release: jest.fn(),
};
const mPool = {
  connect: jest.fn(() => Promise.resolve(mClient)),
  query: jest.fn(),
  end: jest.fn(),
};

module.exports = { mPool, mClient };
