import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from './services';

// Create auth context
const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth error:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const { token, user } = await authService.login(credentials);
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set user state
      setUser(user);
      
      return user;
    } catch (err) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to register');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
