const axios = require('axios');
const { mockQuery } = require('../mocks/mockDb');
jest.mock('axios');

describe('Ticket availability service', () => {
  it('should return available seats for event', async () => {
    axios.get.mockResolvedValueOnce({ data: { total_seats: 100, price: 10.0 } });
    mockQuery.mockResolvedValueOnce({ rows: [{ sold: 30 }] });

    const checkAvailableSeats = require('../../src/services/checkAvailableSeats');
    const result = await checkAvailableSeats(1);

    expect(result.availableSeats).toBe(70);
    expect(result.price).toBe(10.0);
  });
});
