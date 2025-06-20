import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService, ticketsService } from '../services';
import { EventList, EventDetail } from '../components/events';
import { PurchaseForm } from '../components/tickets';

const Events = ({ isDetail = false }) => {
  const [events, setEvents] = useState([]);
  const [event, setEvent] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { id } = useParams();
  const navigate = useNavigate();
  
  // If we're on the detail page or have an ID, load a single event
  const eventId = isDetail ? id : null;
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (eventId) {
          // Fetch single event
          const eventData = await eventsService.getEventById(eventId);
          setEvent(eventData);
          
          // Fetch event availability
          const availabilityData = await eventsService.getEventAvailability(eventId);
          setAvailability(availabilityData);
        } else {
          // Fetch all events
          const eventsData = await eventsService.getEvents();
          setEvents(eventsData);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);
  
  const handlePurchase = () => {
    setShowPurchaseForm(true);
  };
  
  const handlePurchaseSubmit = async (purchaseData) => {
    setPurchaseLoading(true);
    
    try {
      const result = await ticketsService.purchaseTicket(purchaseData);
      // Redirect to tickets page on success
      navigate('/tickets', { state: { purchaseSuccess: true, ticketId: result.ticket.id } });
    } catch (err) {
      setError(err.message);
      console.error('Error purchasing ticket:', err);
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Display event detail view
  if (eventId) {
    return (
      <div className="container mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {event && (
          <>
            {showPurchaseForm ? (
              <PurchaseForm 
                event={event}
                onSubmit={handlePurchaseSubmit}
                loading={purchaseLoading}
              />
            ) : (
              <EventDetail 
                event={event}
                onPurchase={handlePurchase}
                availableSeats={availability ? availability.availableSeats : 0}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    );
  }
  
  // Display events list view
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h1>
      
      <EventList 
        events={events}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default Events;