import React from 'react';
import { format } from 'date-fns';
import { Card, Button } from './common';

// Event card component
export const EventCard = ({ event, onClick }) => {
  const formattedDate = format(new Date(event.event_date), 'MMM d, yyyy • h:mm a');
  
  return (
    <Card 
      onClick={onClick}
      className="h-full"
      hoverable={true}
    >
      <div className="flex flex-col h-full">
        {/* Event category badge */}
        {event.categories && event.categories.length > 0 && (
          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {event.categories[0]}
            </span>
          </div>
        )}
        
        {/* Event title and details */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
        <p className="text-sm text-gray-500 mb-2">{formattedDate}</p>
        <p className="text-sm text-gray-500 mb-4">{event.location}</p>
        
        {/* Event description */}
        <p className="text-gray-600 mb-6 flex-grow line-clamp-3">
          {event.description}
        </p>
        
        {/* Price and seats */}
        <div className="mt-auto flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">€{event.price}</span>
          <span className="text-sm text-gray-500">
            {event.total_seats} seats available
          </span>
        </div>
      </div>
    </Card>
  );
};

// Event list component
export const EventList = ({ events, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>Error loading events: {error}</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-6 py-8 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">No events found</h3>
        <p className="text-gray-500">Check back later for upcoming events.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map(event => (
        <EventCard 
          key={event.id} 
          event={event}
          onClick={() => window.location.href = `/events/${event.id}`}
        />
      ))}
    </div>
  );
};

export const EventDetail = ({ event, onPurchase, availableSeats, loading }) => {
    const formattedDate = event.event_date ? 
      format(new Date(event.event_date), 'EEEE, MMMM d, yyyy') : '';
    
    const formattedTime = event.event_date ? 
      format(new Date(event.event_date), 'h:mm a') : '';
  
    const handlePurchaseClick = () => {
      if (!localStorage.getItem('token')) {
        window.location.href = `/login?redirect=/events/${event.id}`;
        return;
      }
      
      onPurchase();
    };
  
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Event header */}
        <div className="p-6 sm:p-10 border-b border-gray-100">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              {/* Category badges */}
              {event.categories && event.categories.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {event.categories.map((category, index) => (
                    <span 
                      key={index} 
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Event title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              
              {/* Event date and location */}
              <div className="mb-4">
                <p className="text-gray-500 mb-1">
                  <span className="font-medium text-gray-700">{formattedDate}</span>
                  {' • '}
                  <span>{formattedTime}</span>
                </p>
                <p className="text-gray-500">{event.location}</p>
              </div>
            </div>
            
            {/* Price and CTA */}
            <div className="mt-4 sm:mt-0 bg-gray-50 p-4 sm:p-6 rounded-xl">
              <div className="mb-4">
                <p className="text-2xl font-bold text-gray-900 mb-1">€{event.price}</p>
                <p className="text-sm text-gray-500">
                  {availableSeats} seats available
                </p>
              </div>
              <Button 
                variant="primary" 
                fullWidth={true}
                onClick={handlePurchaseClick}
                disabled={loading || availableSeats <= 0}
              >
                {loading ? 'Processing...' : 'Purchase Ticket'}
              </Button>
              {availableSeats <= 0 && (
                <p className="mt-2 text-sm text-red-500 text-center">
                  Sold out
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Event details */}
        <div className="p-6 sm:p-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About this event
          </h2>
          <div className="prose max-w-none text-gray-600">
            <p>{event.description}</p>
          </div>
        </div>
      </div>
    );
  };