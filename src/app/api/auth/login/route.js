import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { identifier, email, password } = await request.json();
    const loginId = identifier || email;

    if (!loginId || !password) {
      return NextResponse.json({ error: 'Email/Phone and password are required' }, { status: 400 });
    }

    const isEmail = loginId.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: loginId } : { phone: loginId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password (bcrypt only — no backdoors)
    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // If not verified, send OTP and require verification
    const isVerified = isEmail ? user.isEmailVerified : user.isPhoneVerified;

    if (!isVerified) {
      const otpCode = generateOTP();

      await prisma.oTP.create({
        data: {
          emailOrPhone: loginId,
          code: otpCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      if (isEmail) {
        try {
          await sendOtpEmail(loginId, otpCode);
        } catch (e) {
          console.error('Login OTP email failed:', e.message);
          // OTP code is NOT logged here for security
        }
      }

      return NextResponse.json({
        message: 'Account not verified. OTP sent.',
        requireVerification: true,
        identifier: loginId,
      }, { status: 200 });
    }

    // Generate JWT using central helper
    const role = user.role || 'user';
    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role });

    const { passwordHash: _, ...safeUser } = user;
    // Ensure role is always in the returned user object
    safeUser.role = role;

    return NextResponse.json({ user: safeUser, token });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
