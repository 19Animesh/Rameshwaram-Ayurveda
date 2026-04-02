'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { register, verifyOtp } = useAuth();
  const router = useRouter();

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await register(name, email, password, phone);
      if (res && res.requireVerification) {
        setOtpMode(true);
        setResendCooldown(30);
      } else {
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
      const identifier = email || phone;
      await verifyOtp(identifier, otp);
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const identifier = email || phone;
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      setOtp('');
      setResendCooldown(30);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };


  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: 48 }}>{otpMode ? '🔐' : '🌱'}</span>
        </div>
        <h1>{otpMode ? 'Verify Your Account' : 'Create Account'}</h1>
        <p className="auth-subtitle">
          {otpMode ? `Enter the 6-digit OTP sent to ${email || phone}` : 'Join Rameshwaram Ayurveda for natural wellness'}
        </p>
        
        {error && <div className="auth-error">❌ {error}</div>}
        
        {!otpMode ? (
          <>
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-input" type="email" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input className="form-input" type="tel" placeholder="10-digit mobile number"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-input" type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              Already have an account? <Link href="/auth/login">Sign In</Link>
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
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {resendCooldown > 0 ? (
                <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.9rem' }}>
                  Resend OTP in {resendCooldown}s
                </span>
              ) : (
                <button type="button" onClick={handleResendOtp} disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--primary, #2e7d32)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                  Didn&apos;t receive OTP? Resend
                </button>
              )}
            </div>
          </form>

        )}
      </div>
    </div>
  );
}
