import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
  try {
    const { identifier, otp } = await request.json();

    if (!identifier || !otp) {
      return errorResponse('Identifier (email/phone) and OTP are required', 400);
    }

    await connectToDatabase();
    
    // 1. Find a valid, unused, non-expired OTP
    const validOtp = await OTP.findOne({
      emailOrPhone: identifier,
      code: otp,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!validOtp) {
      return errorResponse('Invalid or expired OTP. Please request a new one.', 400);
    }

    // 2. Find the user
    const isEmail = identifier.includes('@');
    const existingUser = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!existingUser) {
      return errorResponse('User not found', 404);
    }

    const updateData = isEmail
      ? { isEmailVerified: true }
      : { isPhoneVerified: true };

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
