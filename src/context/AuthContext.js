'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.status === 401 || res.status === 403) {
          // Not logged in — expected state, no error needed
          setUser(null);
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data.data?.user || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const login = async (phone, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    
    // Our API sometimes wraps success payloads inside `data` property
    const payload = json.data || json;
    
    if (payload.requireVerification) return payload; 

    setUser(payload.user);
    return payload;
  };

  const register = async (name, email, password, phone, firebaseToken) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, firebaseToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    
    const payload = json.data || json;
    setUser(payload.user);
    return payload;
  };

  const verifyOtp = async (identifier, firebaseToken) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, firebaseToken }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Verification failed');
    
    const payload = json.data || json;
    setUser(payload.user);
    return payload;
  };

  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    // Note: httpOnly cookies cannot be cleared from JS — the server /api/auth/logout call above handles it
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, verifyOtp, logout, updateUser, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
