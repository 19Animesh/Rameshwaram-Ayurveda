import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { signToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { identifier, otp } = await request.json();

    if (!identifier || !otp) {
      return NextResponse.json(
        { error: 'Identifier (email/phone) and OTP are required' },
        { status: 400 }
      );
    }

    // 1. Find a valid, unused, non-expired OTP
    const validOtp = await prisma.oTP.findFirst({
      where: {
        emailOrPhone: identifier,
        code: otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // 2. Find the user before starting the transaction
    const isEmail = identifier.includes('@');
    const existingUser = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData = isEmail
      ? { isEmailVerified: true }
      : { isPhoneVerified: true };

    // 3. Use a transaction: mark OTP as used AND verify user atomically.
    //    If either step fails, both are rolled back — so the user can retry.
    const [, user] = await prisma.$transaction([
      prisma.oTP.update({
        where: { id: validOtp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
      }),
    ]);

    // 4. Clean up expired OTPs for this identifier (housekeeping)
    await prisma.oTP.deleteMany({
      where: { emailOrPhone: identifier, expiresAt: { lt: new Date() } },
    }).catch(() => {});

    // 5. Generate JWT Token using centralized helper
    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role });

    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({ user: safeUser, token }, { status: 200 });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
