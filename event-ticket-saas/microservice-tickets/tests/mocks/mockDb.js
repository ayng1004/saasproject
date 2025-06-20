const events = {
  100: { id: 100, available: 5 },
  999: { id: 999, available: 1 },
  300: { id: 300, available: 1 },
};

let purchases = [];

module.exports = {
  __mockData: {
    events,
    purchases,
  },

  reset() {
    this.__mockData.purchases = [];
  },

  Pool: class {
    query(text, params) {
      // Simule des requêtes spécifiques
      if (text.includes('FROM tickets')) {
        return Promise.resolve({ rows: Object.values(events) });
      }

      if (text.includes('FROM purchases')) {
        const [userId, eventId] = params;
        const alreadyPurchased = purchases.find(p => p.userId === userId && p.eventId === eventId);
        return Promise.resolve({ rows: alreadyPurchased ? [alreadyPurchased] : [] });
      }

      if (text.includes('INSERT INTO purchases')) {
        const [userId, eventId, quantity] = params;
        purchases.push({ userId, eventId, quantity });
        return Promise.resolve();
      }

      if (text.includes('SELECT available')) {
        const eventId = params[0];
        const event = events[eventId];
        if (!event) return Promise.resolve({ rows: [] });
        return Promise.resolve({ rows: [{ available: event.available }] });
      }

      if (text.includes('UPDATE tickets SET available')) {
        const [newAvailable, eventId] = params;
        if (events[eventId]) {
          events[eventId].available = newAvailable;
        }
        return Promise.resolve();
      }

      return Promise.resolve({ rows: [] });
    }

    connect() {
      return Promise.resolve(this);
    }

    release() {}
  }
};
