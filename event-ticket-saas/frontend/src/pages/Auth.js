import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '../components/common';
import { authService } from '../services';

const Auth = ({ isRegister = false }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log("📤 Form submission started");

    try {
      const payload = isRegister
        ? { email, password, first_name: firstName, last_name: lastName }
        : { email, password };

      console.log('📦 Payload:', payload);

      const data = isRegister
        ? await authService.register(payload)
        : await authService.login(payload);

      console.log('✅ API response:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');

    } catch (err) {
      console.error(' Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white shadow-lg p-8 rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? 'Create an Account' : 'Sign in to EventTicket'}
      </h2>
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <Input
              id="firstName"
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              id="lastName"
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </>
        )}
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <Button type="submit" fullWidth disabled={loading} className="mt-4">
          {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        </Button>
      </form>

      <p className="text-sm text-center mt-6 text-gray-600">
        {isRegister ? (
          <>
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              Sign in
            </a>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <a href="/register" className="text-blue-500 hover:underline">
              Create one
            </a>
          </>
        )}
      </p>
    </div>
  );
};

export default Auth; 