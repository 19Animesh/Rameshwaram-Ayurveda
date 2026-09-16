'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AuthContext = createContext();

/**
 * Parses an auth API response and throws a useful Error on failure.
 * If the server crashed and returned an HTML page, res.json() would throw
 * "Unexpected token '<'", which tells the user nothing — so parse defensively.
 * The thrown error carries `status` and `code` (e.g. 'NO_ACCOUNT').
 */
async function readAuthResponse(res, fallbackMessage) {
  let json = {};
  try {
    json = await res.json();
  } catch {
    json = {};
  }
  if (!res.ok) {
    const err = new Error(json.error || `${fallbackMessage} (server returned ${res.status})`);
    err.status = res.status;
    err.code = json.details?.code;
    throw err;
  }
  return json.data || json;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      // The session cookie is httpOnly and therefore invisible to JS, but the
      // server also sets a readable `has_session` hint on login. When it is
      // absent we skip the request entirely. Previously every anonymous
      // visitor triggered a failing /api/auth/profile call on every page load.
      const hasSession =
        typeof document !== 'undefined' &&
        document.cookie.split('; ').some((c) => c.startsWith('has_session='));

      if (!hasSession) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user ?? data.data?.user ?? null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Sign-in is OTP-only (verifyOtp below). The old password `login` helper was
  // removed together with /api/auth/login, which it called and which was broken.

  const register = useCallback(async (name, email, phone, firebaseToken) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, firebaseToken }),
    });
    const payload = await readAuthResponse(res, 'Registration failed');
    setUser(payload.user);
    return payload;
  }, []);

  const verifyOtp = useCallback(async (identifier, firebaseToken) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, firebaseToken }),
    });
    const payload = await readAuthResponse(res, 'Verification failed');
    setUser(payload.user);
    return payload;
  }, []);

  // Functional update: no dependency on the current `user`, so this callback
  // keeps a stable identity instead of being rebuilt whenever the user changes.
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    // The JWT cookie is httpOnly and cannot be cleared from JS; the logout
    // route expires it. Only the readable session hint is cleared here.
    document.cookie = 'has_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  // Memoised: an object literal here would give every consumer a new context
  // value on each render, re-rendering the header and all product cards for no
  // reason. All handlers above are useCallback so this only changes when the
  // user or loading flag genuinely changes.
  const value = useMemo(
    () => ({ user, register, verifyOtp, logout, updateUser, loading, isAdmin }),
    [user, register, verifyOtp, logout, updateUser, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
