const axios = require('axios');
const { Pool } = require('pg');
const pool = new Pool(); // sera mocké

async function checkAvailableSeats(eventId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as sold FROM tickets WHERE event_id = $1',
    [eventId]
  );
  const sold = parseInt(rows[0].sold, 10);

  const response = await axios.get(`http://localhost:4002/api/events/${eventId}`);
  const event = response.data;

  return {
    availableSeats: event.total_seats - sold,
    price: event.price,
  };
}

module.exports = checkAvailableSeats;
