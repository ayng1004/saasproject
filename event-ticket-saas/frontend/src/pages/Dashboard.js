import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import { ticketsService } from '../services';
import { TicketList } from '../components/tickets';
import { Card } from '../components/common';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const result = await ticketsService.getUserTickets();
        setTickets(result);
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {user?.firstName}!</h1>
      <p className="text-gray-600 mb-8">Here is a summary of your activity:</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card title="My Tickets" onClick={() => window.location.href = '/tickets'}>
          <p className="text-sm text-gray-500 mb-2">View all your tickets</p>
          <span className="text-2xl font-semibold text-gray-900">{tickets.length}</span>
        </Card>

        <Card title="Notifications" onClick={() => alert('Notifications feature coming soon!')}>
          <p className="text-sm text-gray-500 mb-2">Stay updated with event changes</p>
          <span className="text-2xl font-semibold text-gray-900">0</span>
        </Card>

        <Card title="My Profile" onClick={() => window.location.href = '/profile'}>
          <p className="text-sm text-gray-500 mb-2">Update personal information</p>
          <span className="text-2xl font-semibold text-gray-900">{user?.email}</span>
        </Card>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Tickets</h2>
      <TicketList tickets={tickets.slice(0, 3)} loading={loading} />
      <div className="mt-6 text-right">
        <Link to="/tickets" className="text-blue-500 hover:underline text-sm">View all tickets →</Link>
      </div>
    </div>
  );
};

export default Dashboard;
