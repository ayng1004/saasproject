import React, { useState, useEffect } from 'react';
import { eventsService } from '../services';
import { EventList } from '../components/events';
import { Button } from '../components/common';


const Home = () => {
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const events = await eventsService.getEvents({ limit: 6 });
        setFeaturedEvents(events);
      } catch (err) {
        setError('Failed to load events');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Next Event Awaits
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover and book tickets for the best events near you. From concerts to conferences, find your next unforgettable experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="primary"
              size="large"
              className="px-8"
              onClick={() => window.location.href = '/events'}
            >
              Browse Events
            </Button>
            <Button
              variant="outline"
              size="large"
              className="px-8"
              onClick={() => window.location.href = '/register'}
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Events</h2>
            <a 
              href="/events" 
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              View all events →
            </a>
          </div>
          
          <EventList
            events={featuredEvents}
            loading={loading}
            error={error}
          />
        </div>
      </section>
    </div>
  );
};

export default Home;