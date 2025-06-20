// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context';
import { Navbar } from './components/common'; // export nommé
import Home from './pages/Home';              // export default
import Auth from './pages/Auth';              // export default
import Events from './pages/Events';          // export default
import Tickets from './pages/Tickets';        // export default
import Dashboard from './pages/Dashboard';
import { useAuth } from './context';

const App = () => {
  const { user, logout, loading } = useAuth(); //Ajoute loading

  if (loading) {

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
        <Navbar user={user} onLogout={logout} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth isRegister />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<Events isDetail />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/profile" element={<Tickets />} />
              <Route path="/dashboard" element={<Dashboard />} />

            </Routes>
          </main>
          <footer className="bg-gray-50 py-8 mt-10">
            <div className="container mx-auto px-4 text-center text-gray-500">
              &copy; {new Date().getFullYear()} EventTicket. All rights reserved.
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;  // Ceci est l'export par défaut
