'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formattedPhone, setFormattedPhone] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier && auth) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // reCAPTCHA expired, clear it
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        }
      });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!auth) {
      setError('Phone authentication is currently unavailable. Please verify configuration keys.');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;

      // Format phone number to international E.164 format (e.g. +91XXXXXXXXXX)
      let phoneInput = phone.trim();
      let targetPhone = phoneInput;
      if (!phoneInput.startsWith('+')) {
        const digits = phoneInput.replace(/\D/g, '');
        if (digits.length === 10) {
          targetPhone = `+91${digits}`;
        } else if (digits.startsWith('91') && digits.length === 12) {
          targetPhone = `+${digits}`;
        } else {
          throw new Error('Please enter a valid 10-digit mobile number.');
        }
      }

      setFormattedPhone(targetPhone);

      // Trigger Firebase Phone SMS
      const confirmation = await signInWithPhoneNumber(auth, targetPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpMode(true);
      setResendCooldown(20);
    } catch (err) {
      console.error('Firebase Register Error:', err);
      setError(err.message || 'Failed to send verification code. Please check your phone number.');
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (_) {}
      }
    }
    setLoading(false);
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error('No verification session found. Please request a new code.');
      }

      // 1. Confirm OTP with Firebase client SDK
      const userCredential = await confirmationResult.confirm(otp);
      const firebaseToken = await userCredential.user.getIdToken();

      // 2. Submit details + verified token to backend
      // Use formattedPhone (E.164 e.g. +919876543210) — must match Firebase token
      await register(name, email, password, formattedPhone, firebaseToken);
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (err) {
      console.error('OTP Submit Error:', err);
      setError(err.message || 'Invalid or expired verification code');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtp('');
      setResendCooldown(20);
    } catch (err) {
      console.error('OTP Resend Error:', err);
      setError(err.message || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: 48 }}>{otpMode ? '🔐' : '🌱'}</span>
        </div>
        <h1>{otpMode ? 'Verify Your Account' : 'Create Account'}</h1>
        <p className="auth-subtitle">
          {otpMode ? `Enter the 6-digit OTP sent to ${phone}` : 'Join Rameshwaram Ayurveda for natural wellness'}
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
                <label>Phone Number *</label>
                <input className="form-input" type="tel" placeholder="10-digit mobile number"
                  value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Email Address (Optional)</label>
                <input className="form-input" type="email" placeholder="your@email.com (for invoices)"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input className="form-input" type="password" placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Sending Code...' : 'Create Account'}
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
              {loading ? 'Verifying...' : 'Verify Phone'}
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
