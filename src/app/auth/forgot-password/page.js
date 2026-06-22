'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { normalizePhone } from '@/lib/phone';

// Map raw Firebase error codes to human-friendly messages
const FIREBASE_ERRORS = {
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/invalid-phone-number': 'Invalid phone number format.',
  'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please refresh and try again.',
  'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
  'auth/user-disabled': 'This account has been disabled.',
};

function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  const code = err?.code || '';
  return FIREBASE_ERRORS[code] || err.message || 'Something went wrong. Please try again.';
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { updateUser } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'password'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [firebaseToken, setFirebaseToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationPhone, setVerificationPhone] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);



  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier && auth) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        },
      });
    }
  };

  const clearRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (_) {}
      window.recaptchaVerifier = null;
    }
  };

  // Step 1 — Send OTP to phone
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!auth) throw new Error('Phone verification is currently unavailable.');
      const formatted = normalizePhone(phone.trim());
      if (!formatted) throw new Error('Please enter a valid 10-digit Indian mobile number.');

      setVerificationPhone(formatted);
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      setError(friendlyError(err));
      clearRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!confirmationResult) throw new Error('No verification session. Please go back and try again.');
      const userCredential = await confirmationResult.confirm(otp);
      const token = await userCredential.user.getIdToken();
      setFirebaseToken(token);
      setStep('password');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, verificationPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtp('');
      setResendCooldown(30);
    } catch (err) {
      setError(friendlyError(err));
      clearRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: verificationPhone,
          firebaseToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed.');
      if (data.user) updateUser(data.user);
      router.push('/?reset=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stepIcon = { phone: '🔑', otp: '🔐', password: '🔒' }[step];
  const stepTitle = {
    phone: 'Forgot Password',
    otp: 'Enter Verification Code',
    password: 'Set New Password',
  }[step];
  const stepSubtitle = {
    phone: 'Enter your registered mobile number to receive a verification code.',
    otp: `Enter the 6-digit OTP sent to ${verificationPhone}`,
    password: 'Choose a new password for your account.',
  }[step];

  return (
    <div className="auth-page">
      {/* Invisible reCAPTCHA anchor */}
      <div id="recaptcha-container"></div>

      <div className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ fontSize: 48 }}>{stepIcon}</span>
        </div>
        <h1>{stepTitle}</h1>
        <p className="auth-subtitle">{stepSubtitle}</p>

        {error && <div className="auth-error">❌ {error}</div>}

        {/* Step 1 — Phone number */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="fp-phone">Mobile Number</label>
              <input
                id="fp-phone"
                className="form-input"
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP…' : 'Send Verification Code'}
            </button>
            <div className="auth-footer" style={{ marginTop: 'var(--space-md)' }}>
              Remember your password?{' '}
              <Link href="/auth/login">Sign In</Link>
            </div>
          </form>
        )}

        {/* Step 2 — OTP verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="fade-in">
            <div className="form-group">
              <label htmlFor="fp-otp">6-Digit OTP</label>
              <input
                id="fp-otp"
                className="form-input"
                type="text"
                maxLength="6"
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '4px' }}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Verifying…' : 'Verify Code'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {resendCooldown > 0 ? (
                <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.9rem' }}>
                  Resend OTP in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--primary, #2e7d32)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                >
                  Didn&apos;t receive OTP? Resend
                </button>
              )}
            </div>

            <div className="auth-footer" style={{ marginTop: 'var(--space-md)' }}>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); clearRecaptcha(); }}
                style={{ background: 'none', border: 'none', color: 'var(--green-700)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                ← Change Number
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — New password */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="fade-in">
            <div className="form-group">
              <label htmlFor="fp-newpw">New Password</label>
              <input
                id="fp-newpw"
                className="form-input"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label htmlFor="fp-confirmpw">Confirm Password</label>
              <input
                id="fp-confirmpw"
                className="form-input"
                type="password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Saving…' : '🔒 Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
