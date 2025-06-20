import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, Input, Button } from './common';

// Ticket card component
export const TicketCard = ({ ticket }) => {
  // Format the purchase date
  const formattedPurchaseDate = format(
    new Date(ticket.purchase_date), 
    'MMM d, yyyy'
  );
  
  // Get status color based on ticket status
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="border border-gray-200">
      <div className="flex flex-col">
        {/* Ticket header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {ticket.event ? ticket.event.title : 'Event Title'}
            </h3>
            <p className="text-sm text-gray-500">
              {ticket.event && ticket.event.event_date ? 
                format(new Date(ticket.event.event_date), 'EEEE, MMMM d, yyyy • h:mm a') : 
                'Event Date'}
            </p>
          </div>
          <span 
            className={`px-2 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(ticket.status)}`}
          >
            {ticket.status}
          </span>
        </div>
        
        {/* Ticket details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Ticket Number</p>
              <p className="text-sm font-medium text-gray-900">{ticket.ticket_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Purchase Date</p>
              <p className="text-sm font-medium text-gray-900">{formattedPurchaseDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-sm font-medium text-gray-900">€{ticket.price}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Payment Method</p>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {ticket.payment_method || 'Credit Card'}
              </p>
            </div>
          </div>
        </div>
        
        {/* QR Code placeholder */}
        <div className="mx-auto w-32 h-32 bg-gray-100 flex items-center justify-center rounded-lg mb-3">
          <span className="text-xs text-gray-500">QR Code</span>
        </div>
        
        <p className="text-center text-xs text-gray-500">
          Present this ticket at the event entrance
        </p>
      </div>
    </Card>
  );
};

// Ticket list component
export const TicketList = ({ tickets, loading, error }) => {
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
        <p>Error loading tickets: {error}</p>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 px-6 py-8 rounded-lg text-center">
        <h3 className="text-lg font-medium mb-2">No tickets found</h3>
        <p className="text-gray-500">You haven't purchased any tickets yet.</p>
        <Button 
          variant="primary" 
          className="mt-4"
          onClick={() => window.location.href = '/events'}
        >
          Browse Events
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};

// Purchase form component
export const PurchaseForm = ({ event, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    payment_method: 'credit_card',
    card_number: '',
    expiry: '',
    cvv: '',
    name_on_card: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user starts typing again
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate card number
    if (!formData.card_number) {
      newErrors.card_number = 'Card number is required';
    } else if (!/^\d{13,19}$/.test(formData.card_number.replace(/\s/g, ''))) {
      newErrors.card_number = 'Card number must be between 13 and 19 digits';
    }
    
    // Validate expiry date
    if (!formData.expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = 'Expiry date must be in MM/YY format';
    }
    
    // Validate CVV
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    // Validate name on card
    if (!formData.name_on_card) {
      newErrors.name_on_card = 'Name on card is required';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form data
    onSubmit({
      event_id: event.id,
      ...formData
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Purchase Ticket</h2>
        <p className="text-sm text-gray-500 mt-1">
          For {event.title} - {new Date(event.event_date).toLocaleDateString()}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
          
          <Input
            id="card_number"
            label="Card Number"
            type="text"
            name="card_number"
            placeholder="1234 5678 9012 3456"
            value={formData.card_number}
            onChange={handleChange}
            error={errors.card_number}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="expiry"
              label="Expiry Date"
              type="text"
              name="expiry"
              placeholder="MM/YY"
              value={formData.expiry}
              onChange={handleChange}
              error={errors.expiry}
              required
            />
            
            <Input
              id="cvv"
              label="CVV"
              type="text"
              name="cvv"
              placeholder="123"
              value={formData.cvv}
              onChange={handleChange}
              error={errors.cvv}
              required
            />
          </div>
          
          <Input
            id="name_on_card"
            label="Name on Card"
            type="text"
            name="name_on_card"
            placeholder="John Doe"
            value={formData.name_on_card}
            onChange={handleChange}
            error={errors.name_on_card}
            required
          />
        </div>
        
        <div className="border-t border-gray-100 pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-600">Ticket Price</span>
            <span className="text-lg font-semibold text-gray-900">€{event.price}</span>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth={true}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Purchase'}
          </Button>
        </div>
      </form>
    </div>
  );
};