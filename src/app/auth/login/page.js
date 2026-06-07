'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [verificationPhone, setVerificationPhone] = useState('');
  const { login, verifyOtp } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier && auth) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        }
      });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(identifier, password);
      
      if (res && res.requireVerification) {
        if (!auth) {
          throw new Error('Phone verification is currently unavailable. Please verify configuration.');
        }

        const targetPhone = res.phone;
        if (!targetPhone) {
          throw new Error('No phone number is associated with this account. Please contact support.');
        }

        // Format to E.164 format
        let formatted = targetPhone.trim();
        if (!formatted.startsWith('+')) {
          const digits = formatted.replace(/\D/g, '');
          if (digits.length === 10) {
            formatted = `+91${digits}`;
          } else if (digits.startsWith('91') && digits.length === 12) {
            formatted = `+${digits}`;
          } else {
            formatted = `+${digits}`;
          }
        }

        setVerificationPhone(formatted);

        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;

        // Trigger Firebase Phone SMS
        const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
        setConfirmationResult(confirmation);
        setOtpMode(true);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || '/';
        router.push(redirectUrl);
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
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
        throw new Error('No verification session found. Please try again.');
      }

      // 1. Confirm OTP with Firebase client
      const userCredential = await confirmationResult.confirm(otp);
      const firebaseToken = await userCredential.user.getIdToken();

      // 2. Submit token to verify-otp server API
      await verifyOtp(identifier, firebaseToken);
      
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (err) {
      console.error('OTP Verify Error:', err);
      setError(err.message || 'Invalid or expired verification code');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: 48 }}>{otpMode ? '🔐' : '🌿'}</span>
        </div>
        <h1>{otpMode ? 'Verification Required' : 'Welcome Back'}</h1>
        <p className="auth-subtitle">
          {otpMode ? `Enter the 6-digit OTP sent to ${verificationPhone}` : 'Sign in to your Rameshwaram Ayurveda account'}
        </p>
        
        {error && <div className="auth-error">❌ {error}</div>}
        
        {!otpMode ? (
          <>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label>Phone Number or Email Address</label>
                <input className="form-input" type="text" placeholder="e.g. 9876543210 or your@email.com"
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
