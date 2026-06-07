import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { getUserByEmailOrPhone } from '@/services/userService';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';

const loginSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
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

    const { phone, password } = parsed.data;

    // Format phone number to E.164 for database query
    let targetPhone = phone.trim();
    if (!targetPhone.startsWith('+')) {
      const digits = targetPhone.replace(/\D/g, '');
      if (digits.length === 10) {
        targetPhone = `+91${digits}`;
      } else if (digits.startsWith('91') && digits.length === 12) {
        targetPhone = `+${digits}`;
      }
    }

    // Connect to database and look up user strictly by phone number
    const connectToDatabase = (await import('@/lib/mongodb')).default;
    const User = (await import('@/models/User')).default;
    await connectToDatabase();
    const user = await User.findOne({ phone: targetPhone }).lean();

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
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days session
        path: '/'
      });
      return response;
    }

    const isVerified = user.isPhoneVerified;

    if (!isVerified) {
      // Return flag to let client-side trigger Firebase phone OTP verification
      return successResponse({
        message: 'Account not verified. Verification required.',
        requireVerification: true,
        identifier: targetPhone,
        phone: user.phone,
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
