import axios from 'axios'; // Ajoute cette ligne en haut de ton fichier


const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle token expiration
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },
  
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get user data');
    }
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  }
};

// Events services
export const eventsService = {
  // Get all events
  getEvents: async (filters = {}) => {
    try {
      const response = await api.get('/events', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },
  
  // Get event by ID
  getEventById: async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event');
    }
  },
  
  // Create a new event
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },
  
  // Check event availability
  getEventAvailability: async (eventId) => {
    try {
      const response = await api.get(`/tickets/availability/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check availability');
    }
  }
};

// Tickets services
export const ticketsService = {
  // Get user tickets
  getUserTickets: async () => {
    try {
      const response = await api.get('/tickets/my');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tickets');
    }
  },
  
  // Purchase ticket
  purchaseTicket: async (purchaseData) => {
    try {
      const response = await api.post('/tickets/purchase', purchaseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to purchase ticket');
    }
  },
  
  // Cancel ticket
  cancelTicket: async (ticketId) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel ticket');
    }
  }
};
