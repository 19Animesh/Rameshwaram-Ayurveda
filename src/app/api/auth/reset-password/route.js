import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';

/**
 * POST /api/auth/reset-password
 *
 * Body: { phone, firebaseToken, newPassword }
 *
 * Flow:
 *  1. Rate-limit by IP and phone
 *  2. Verify Firebase idToken server-side
 *  3. Confirm the Firebase token's phone matches the supplied phone
 *  4. Find the user, hash the new password, save it
 *  5. Mark isPhoneVerified = true (re-verification implicit in OTP success)
 *  6. Issue a fresh JWT cookie so the user is immediately logged in
 */
export async function POST(request) {
  try {
    const rawIp = request.headers.get('x-forwarded-for') || 'unknown';
    const ip = rawIp.split(',')[0].trim();

    // 5 reset attempts per 10 minutes per IP
    if (!(await checkRateLimit(ip, 5, 600000, 'reset-password-ip'))) {
      return errorResponse('Too many reset attempts. Please try again later.', 429);
    }

    const { phone, firebaseToken, newPassword } = await request.json();

    if (!phone || !firebaseToken || !newPassword) {
      return errorResponse('phone, firebaseToken, and newPassword are all required', 400);
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    const targetPhone = normalizePhone(phone);
    if (!targetPhone) {
      return errorResponse('Enter a valid 10-digit Indian mobile number', 400);
    }

    // 3 reset attempts per 10 minutes per phone number
    if (!(await checkRateLimit(targetPhone, 3, 600000, 'reset-password-phone'))) {
      return errorResponse('Too many reset attempts for this number. Please try again later.', 429);
    }

    // Verify Firebase token server-side
    let firebasePhone = '';
    try {
      const adminSDK = getFirebaseAdmin();
      const decoded = await adminSDK.auth().verifyIdToken(firebaseToken);
      firebasePhone = decoded.phone_number;
    } catch (err) {
      console.error('Firebase token verification failed (reset-password):', err.message);
      return errorResponse('Invalid or expired verification token', 401);
    }

    // Phone in Firebase token must match the phone supplied by the client
    if (!phoneNumbersMatch(targetPhone, firebasePhone)) {
      return errorResponse('Verified phone number does not match the provided phone number', 400);
    }

    await connectToDatabase();
    const user = await User.findOne({ phone: targetPhone });
    if (!user) {
      return errorResponse('No account found for this phone number', 404);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await User.findByIdAndUpdate(
      user._id,
      { passwordHash, isPhoneVerified: true },
      { new: true }
    ).lean();

    const token = signToken({
      userId: updated._id.toString(),
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
    });

    const { passwordHash: _, ...safeUser } = updated;
    const userOut = { ...safeUser, id: updated._id.toString() };

    const response = successResponse({ user: userOut, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Reset Password Error:', error);
    return errorResponse('Password reset failed. Please try again.');
  }
}
