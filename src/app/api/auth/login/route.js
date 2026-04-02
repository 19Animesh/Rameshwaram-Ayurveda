import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Neon free-tier databases sleep after inactivity.
 * This wrapper retries the DB call once after a short delay if it fails
 * on the first attempt (cold-start wake-up).
 */
async function withNeonRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const isConnectionErr =
      err.message?.includes('ECONNRESET') ||
      err.message?.includes('ENOTFOUND') ||
      err.message?.includes('connect') ||
      err.code === 'P1001' || // Prisma: can't reach database
      err.code === 'P1017';  // Prisma: server closed connection
    if (isConnectionErr) {
      // Wait 2s then retry once — this wakes up the Neon instance
      await new Promise(r => setTimeout(r, 2000));
      return await fn();
    }
    throw err;
  }
}

export async function POST(request) {
  try {
    const { identifier, email, password } = await request.json();
    const loginId = identifier || email;

    if (!loginId || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required' }, { status: 400 });
    }

    const isEmail = loginId.includes('@');

    // Use retry wrapper so Neon cold-starts don't fail the login
    const user = await withNeonRetry(() =>
      prisma.user.findFirst({
        where: isEmail ? { email: loginId } : { phone: loginId }
      })
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Admin accounts skip OTP — they are always considered verified
    const role = user.role || 'user';
    if (role === 'admin') {
      const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role });
      const { passwordHash: _, ...safeUser } = user;
      safeUser.role = role;
      return NextResponse.json({ user: safeUser, token });
    }

    // Regular users: check email/phone verification
    const isVerified = isEmail ? user.isEmailVerified : user.isPhoneVerified;

    if (!isVerified) {
      const otpCode = generateOTP();

      await withNeonRetry(() =>
        prisma.oTP.create({
          data: {
            emailOrPhone: loginId,
            code: otpCode,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          },
        })
      );

      if (isEmail) {
        try {
          await sendOtpEmail(loginId, otpCode);
        } catch (e) {
          console.error('Login OTP email failed:', e.message);
        }
      }

      return NextResponse.json({
        message: 'Account not verified. OTP sent.',
        requireVerification: true,
        identifier: loginId,
      }, { status: 200 });
    }

    // Generate JWT
    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role });

    const { passwordHash: _, ...safeUser } = user;
    safeUser.role = role;

    return NextResponse.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Login failed. Please try again in a moment.' }, { status: 500 });
  }
}
