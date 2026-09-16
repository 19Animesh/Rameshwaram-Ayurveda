'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  sendOtp,
  clearRecaptcha,
  toE164,
  friendlyAuthError,
  postLoginDestination,
} from '@/lib/phoneAuthClient';

// Accounts are OTP-only: customers sign in with their mobile number and a
// code, so registration no longer asks for a password that was never used.

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formattedPhone, setFormattedPhone] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const confirmationResultRef = useRef(null);
  // See the login page: reuse the token if the server rejects the first try,
  // because a Firebase confirmation cannot be used twice.
  const firebaseTokenRef = useRef(null);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Prefill from /auth/register?phone=XXXXXXXXXX (linked from the login page)
  useEffect(() => {
    const fromQuery = new URLSearchParams(window.location.search).get('phone');
    if (fromQuery) setPhone(fromQuery.replace(/\D/g, '').slice(-10));
  }, []);

  useEffect(() => clearRecaptcha, []);

  const resetVerification = () => {
    confirmationResultRef.current = null;
    firebaseTokenRef.current = null;
  };

  const showError = (err, fallback) => {
    console.error(fallback, err);
    setAlreadyRegistered(err?.code === 'ALREADY_REGISTERED');
    setError(friendlyAuthError(err, fallback));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAlreadyRegistered(false);

    setLoading(true);
    try {
      const targetPhone = toE164(phone);
      setFormattedPhone(targetPhone);
      resetVerification();

      confirmationResultRef.current = await sendOtp(targetPhone);
      setOtp('');
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      showError(err, 'Failed to send verification code. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAlreadyRegistered(false);
    setLoading(true);
    try {
      if (!firebaseTokenRef.current) {
        if (!confirmationResultRef.current) {
          throw new Error('Your OTP session was lost. Please tap “Change details” and request a new code.');
        }
        const userCredential = await confirmationResultRef.current.confirm(otp);
        firebaseTokenRef.current = await userCredential.user.getIdToken(true);
      }

      const { user } = await register(name, email || '', formattedPhone, firebaseTokenRef.current);
      router.push(postLoginDestination(user));
    } catch (err) {
      showError(err, 'Invalid or expired verification code');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setAlreadyRegistered(false);
    setLoading(true);
    try {
      resetVerification();
      confirmationResultRef.current = await sendOtp(formattedPhone);
      setOtp('');
      setResendCooldown(30);
    } catch (err) {
      showError(err, 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Invisible container for Firebase reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="auth-card fade-in">
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green-100), var(--gold-100))',
            fontSize: 36, boxShadow: '0 4px 16px rgba(61,107,30,0.15)',
          }}>
            {step === 'otp' ? '🔐' : '🌱'}
          </div>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          {step === 'otp' ? 'Verify Your Number' : 'Create Account'}
        </h1>
        <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          {step === 'otp'
            ? <>We sent a 6-digit code to <strong>{formattedPhone}</strong></>
            : 'Join Rameshwaram Ayurveda for natural wellness'}
        </p>

        {error && (
          <div className="auth-error">
            ❌ {error}
            {alreadyRegistered && (
              <div style={{ marginTop: 8 }}>
                <Link href="/auth/login">Sign in instead →</Link>
              </div>
            )}
          </div>
        )}

        {step === 'form' ? (
          <>
            <form onSubmit={handleRegisterSubmit}>
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="reg-name">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  id="reg-name"
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="reg-phone">
                  Mobile Number <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-500)', fontSize: '0.95rem', fontWeight: 500,
                    borderRight: '1px solid var(--gray-200)', paddingRight: '10px', lineHeight: 1,
                  }}>+91</span>
                  <input
                    id="reg-phone"
                    className="form-input"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    style={{ paddingLeft: '58px' }}
                    autoComplete="tel"
                  />
                </div>
                <small style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  📱 OTP will be sent to this number for verification
                </small>
              </div>

              {/* Email — Optional */}
              <div className="form-group">
                <label htmlFor="reg-email" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Email Address
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, color: 'var(--gray-500)',
                    background: 'var(--gray-100)', borderRadius: 'var(--radius-full)',
                    padding: '2px 8px', letterSpacing: '0.5px', textTransform: 'uppercase',
                  }}>Optional</span>
                </label>
                <input
                  id="reg-email"
                  className="form-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <small style={{ color: 'var(--gray-500)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                  📧 Used for order invoices and updates (skip if you prefer)
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={loading || phone.replace(/\D/g, '').length < 10 || !name.trim()}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Sending OTP…
                  </span>
                ) : 'Create Account & Send OTP'}
              </button>
            </form>

            <div className="auth-footer" style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
              Already have an account? <Link href="/auth/login">Sign In</Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} className="fade-in">
            <div className="form-group">
              <label htmlFor="reg-otp">6-Digit OTP</label>
              <input
                id="reg-otp"
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ textAlign: 'center', fontSize: '28px', letterSpacing: '8px', fontWeight: 600 }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || otp.length < 6}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Verifying…
                </span>
              ) : 'Verify & Create Account'}
            </button>

            {/* Resend / timer */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              {resendCooldown > 0 ? (
                <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                  Resend OTP in <strong>{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--green-700)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                >
                  Didn&apos;t receive OTP? Resend
                </button>
              )}
            </div>

            {/* Back to form step */}
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setStep('form'); setOtp(''); setError(''); setAlreadyRegistered(false); resetVerification(); }}
                style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
              >
                ← Change details
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
