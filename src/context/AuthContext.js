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
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    
    // Our API sometimes wraps success payloads inside `data` property
    const payload = json.data || json;
    
    if (payload.requireVerification) return payload; 

    setUser(payload.user);
    localStorage.setItem('ayurvedic_user', JSON.stringify(payload.user));
    localStorage.setItem('ayurvedic_token', payload.token);
    document.cookie = `token=${payload.token}; path=/; max-age=604800`;
    return payload;
  };

  const register = async (name, email, password, phone) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    
    const payload = json.data || json;
    if (payload.requireVerification) return payload;

    setUser(payload.user);
    localStorage.setItem('ayurvedic_user', JSON.stringify(payload.user));
    localStorage.setItem('ayurvedic_token', payload.token);
    document.cookie = `token=${payload.token}; path=/; max-age=604800`;
    return payload;
  };

  const verifyOtp = async (identifier, otp) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Verification failed');
    
    const payload = json.data || json;
    setUser(payload.user);
    localStorage.setItem('ayurvedic_user', JSON.stringify(payload.user));
    localStorage.setItem('ayurvedic_token', payload.token);
    document.cookie = `token=${payload.token}; path=/; max-age=604800`;
    return payload;
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
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout, updateUser, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
