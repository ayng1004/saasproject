const mockQuery = jest.fn();
const mClient = {
  query: mockQuery,
  release: jest.fn(),
};
const mPool = {
  connect: jest.fn(() => Promise.resolve(mClient)),
  query: mockQuery,
  end: jest.fn(),
};

jest.mock('pg', () => ({
  Pool: jest.fn(() => mPool),
}));

module.exports = { mockQuery };
