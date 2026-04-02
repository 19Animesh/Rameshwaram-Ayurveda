'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verifyOtp } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (res && res.requireVerification) {
        setOtpMode(true);
      } else {
        clearCart();
        router.push('/');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(identifier, otp);
      clearCart();
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: 48 }}>{otpMode ? '🔐' : '🌿'}</span>
        </div>
        <h1>{otpMode ? 'Verification Required' : 'Welcome Back'}</h1>
        <p className="auth-subtitle">
          {otpMode ? `Enter the 6-digit OTP sent to ${identifier}` : 'Sign in to your Rameshwaram Ayurveda account'}
        </p>
        
        {error && <div className="auth-error">❌ {error}</div>}
        
        {!otpMode ? (
          <>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Email Address or Phone Number</label>
                <input className="form-input" type="text" placeholder="your@email.com or +91..."
                  value={identifier} onChange={e => setIdentifier(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-input" type="password" placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account? <Link href="/auth/register">Sign Up</Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} className="fade-in">
            <div className="form-group">
              <label>6-Digit OTP</label>
              <input className="form-input" type="text" maxLength="6" placeholder="123456"
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required 
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '4px' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading || otp.length < 6}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <div className="auth-footer" style={{ marginTop: 'var(--space-md)' }}>
              <button type="button" onClick={() => setOtpMode(false)} style={{ background: 'none', border: 'none', color: 'var(--green-700)', cursor: 'pointer', textDecoration: 'underline' }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
