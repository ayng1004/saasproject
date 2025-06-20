import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { ticketsService } from '../services';
import { TicketList } from '../components/tickets';
import { Card } from '../components/common';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const purchaseSuccess = location.state?.purchaseSuccess;

  useEffect(() => {
    const fetchTickets = async () => {
      if (!isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const userTickets = await ticketsService.getUserTickets();
        setTickets(userTickets);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Please sign in
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your tickets.
            </p>
            <Link
              to="/login?redirect=/tickets"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
            >
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
      <p className="text-gray-600 mb-8">Manage your event tickets</p>

      {purchaseSuccess && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          Your ticket purchase was successful! You can view your ticket details below.
        </div>
      )}

      <TicketList
        tickets={tickets}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default Tickets;
