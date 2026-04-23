import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserByEmailOrPhone } from '@/services/userService';
import { sendOtpEmail } from '@/lib/mailer';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';

import { checkRateLimit } from '@/lib/rateLimit';
import OTP from '@/models/OTP';
import connectToDatabase from '@/lib/mongodb';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 5, 60000))) { // Max 5 login attempts per minute per IP
      return errorResponse('Too many login attempts', 429);
    }

    const data = await request.json();
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return errorResponse('Validation error', 400, parsed.error.format());
    }

    const { identifier, email, password } = parsed.data;
    const loginId = identifier || email;

    if (!loginId) {
      return errorResponse('Email or Phone is required', 400);
    }

    const isEmail = loginId.includes('@');
    const user = await getUserByEmailOrPhone(loginId);

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return errorResponse('Invalid credentials', 401);
    }

    const role = user.role || 'user';
    if (role === 'admin') {
      const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role });
      const { passwordHash: _, ...safeUser } = user;
      safeUser.role = role;
      
      const response = successResponse({ user: safeUser, token });
      response.cookies.set('token', token, {
        httpOnly: true, // Prevents XSS script access to Token
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days session
        path: '/'
      });
      return response;
    }

    const isVerified = isEmail ? user.isEmailVerified : user.isPhoneVerified;

    if (!isVerified) {
      const otpCode = generateOTP();
      const otpHash = await bcrypt.hash(otpCode, 10);

      await connectToDatabase();
      await OTP.create({
        emailOrPhone: loginId,
        code: otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      if (isEmail) {
        try {
          await sendOtpEmail(loginId, otpCode);
        } catch (e) {
          console.warn('Login OTP email failed', e);
        }
      }

      return successResponse({
        message: 'Account not verified. OTP sent.',
        requireVerification: true,
        identifier: loginId,
      }, 200);
    }

    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role });
    const { passwordHash: _, ...safeUser } = user;
    safeUser.role = role;

    const response = successResponse({ user: safeUser, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days session
      path: '/'
    });
    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return errorResponse('Login failed. Please try again in a moment.');
  }
}
