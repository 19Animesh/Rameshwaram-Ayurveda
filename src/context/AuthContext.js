'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ayurvedic_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ayurvedic_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    if (data.requireVerification) return data; // Return to trigger OTP UI

    setUser(data.user);
    localStorage.setItem('ayurvedic_user', JSON.stringify(data.user));
    localStorage.setItem('ayurvedic_token', data.token);
    return data;
  };

  const register = async (name, email, password, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    
    if (data.requireVerification) return data;

    setUser(data.user);
    localStorage.setItem('ayurvedic_user', JSON.stringify(data.user));
    localStorage.setItem('ayurvedic_token', data.token);
    return data;
  };

  const verifyOtp = async (identifier, otp) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    
    setUser(data.user);
    localStorage.setItem('ayurvedic_user', JSON.stringify(data.user));
    localStorage.setItem('ayurvedic_token', data.token);
    return data;
  };

  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem('ayurvedic_user', JSON.stringify(merged));
    localStorage.setItem('ayurvedic_token', localStorage.getItem('ayurvedic_token') || '');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ayurvedic_user');
    localStorage.removeItem('ayurvedic_token');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout, updateUser, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
