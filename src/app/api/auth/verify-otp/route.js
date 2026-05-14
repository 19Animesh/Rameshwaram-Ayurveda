import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // Rate limit by IP: 10 verify attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 10, 60000, 'verify-otp-ip'))) {
      return errorResponse('Too many verification attempts. Please try again later.', 429);
    }

    const { identifier, otp } = await request.json();

    if (!identifier || !otp) {
      return errorResponse('Identifier (email/phone) and OTP are required', 400);
    }

    // Rate limit by identifier: 5 verify attempts per minute per email/phone
    if (!(await checkRateLimit(identifier, 5, 60000, 'verify-otp-id'))) {
      return errorResponse('Too many verification attempts for this account. Please try again later.', 429);
    }

    await connectToDatabase();
    
    // 1. Find a valid, unused, non-expired OTP
    const validOtp = await OTP.findOne({
      emailOrPhone: identifier,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!validOtp) {
      return errorResponse('Invalid or expired OTP. Please request a new one.', 400);
    }

    // 2. Verify OTP code and track failed attempts
    const isMatch = await bcrypt.compare(otp, validOtp.code);
    if (!isMatch) {
      const updated = await OTP.findByIdAndUpdate(
        validOtp._id,
        { $inc: { attempts: 1 } },
        { new: true }
      );
      // Invalidate OTP after 5 failed attempts to prevent brute force
      if (updated.attempts >= 5) {
        await OTP.findByIdAndUpdate(validOtp._id, { used: true });
      }
      return errorResponse('Invalid or expired OTP. Please request a new one.', 400);
    }

    // 3. Find the user
    const isEmail = identifier.includes('@');
    const existingUser = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!existingUser) {
      return errorResponse('User not found', 404);
    }

    const updateData = { isPhoneVerified: true };

    // 3. Sequential update
    await OTP.findByIdAndUpdate(validOtp._id, { used: true });
    
    const userRaw = await User.findByIdAndUpdate(existingUser._id, updateData, { new: true }).lean();
    const user = { ...userRaw, id: userRaw._id.toString() };

    // 4. Clean up expired OTPs for this identifier (housekeeping)
    await OTP.deleteMany({
      emailOrPhone: identifier, expiresAt: { $lt: new Date() }
    }).catch(() => {});

    // 5. Generate JWT Token using centralized helper
    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role });

    const { passwordHash: _, ...safeUser } = user;

    const response = successResponse({ user: safeUser, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    return response;
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return errorResponse('Verification failed');
  }
}
