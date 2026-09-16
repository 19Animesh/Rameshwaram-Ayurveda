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

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formattedPhone, setFormattedPhone] = useState('');
  const { verifyOtp } = useAuth();
  const router = useRouter();

  // Refs survive React Strict Mode double-renders
  const confirmationResultRef = useRef(null);
  const sendingOtpRef = useRef(false);
  // Firebase ID token from a successful OTP confirmation. A confirmation can
  // only be used once, so if our server rejects the login (rate limit, network
  // blip) the retry reuses this token instead of re-confirming a spent code,
  // which Firebase would report as an invalid/expired OTP.
  const firebaseTokenRef = useRef(null);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Do not leave a verifier bound to this page's DOM after navigating away.
  useEffect(() => clearRecaptcha, []);

  const resetVerification = () => {
    confirmationResultRef.current = null;
    firebaseTokenRef.current = null;
  };

  const showError = (err, fallback) => {
    console.error(fallback, err);
    setNoAccount(err?.code === 'NO_ACCOUNT');
    setError(friendlyAuthError(err, fallback));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (sendingOtpRef.current) return;
    sendingOtpRef.current = true;

    setError('');
    setNoAccount(false);
    setLoading(true);
    try {
      const target = toE164(phone);
      setFormattedPhone(target);
      resetVerification();

      confirmationResultRef.current = await sendOtp(target);
      setOtp('');
      setStep('otp');
      setResendCooldown(30);
    } catch (err) {
      showError(err, 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
      sendingOtpRef.current = false;
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNoAccount(false);
    setLoading(true);
    try {
      if (!firebaseTokenRef.current) {
        if (!confirmationResultRef.current) {
          throw new Error('Your OTP session was lost. Please tap “Change number” and request a new code.');
        }
        const userCredential = await confirmationResultRef.current.confirm(otp);
        firebaseTokenRef.current = await userCredential.user.getIdToken(true);
      }

      const { user } = await verifyOtp(formattedPhone, firebaseTokenRef.current);
      router.push(postLoginDestination(user));
    } catch (err) {
      showError(err, 'Invalid or expired verification code');
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setNoAccount(false);
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
            {step === 'otp' ? '🔐' : '🌿'}
          </div>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
          {step === 'otp' ? 'Enter OTP' : 'Welcome Back'}
        </h1>
        <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          {step === 'otp'
            ? <>We sent a 6-digit code to <strong>{formattedPhone}</strong></>
            : 'Sign in with your registered mobile number'}
        </p>

        {error && (
          <div className="auth-error">
            ❌ {error}
            {noAccount && (
              <div style={{ marginTop: 8 }}>
                <Link href={`/auth/register?phone=${formattedPhone.replace(/\D/g, '').slice(-10)}`}>
                  Create an account with this number →
                </Link>
              </div>
            )}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="login-phone">Mobile Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--gray-500)', fontSize: '0.95rem', fontWeight: 500,
                  borderRight: '1px solid var(--gray-200)', paddingRight: '10px', lineHeight: 1,
                }}>+91</span>
                <input
                  id="login-phone"
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
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Sending OTP…
                </span>
              ) : 'Send OTP'}
            </button>

            <div className="auth-footer" style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
              Don&apos;t have an account? <Link href="/auth/register">Sign Up</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="fade-in">
            <div className="form-group">
              <label htmlFor="login-otp">6-Digit OTP</label>
              <input
                id="login-otp"
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
              ) : 'Verify & Sign In'}
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

            {/* Back to phone step */}
            <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); setNoAccount(false); resetVerification(); }}
                style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}
              >
                ← Change number
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
