import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { sendOtpEmail } from '@/lib/mailer';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check the user exists
    const isEmail = identifier.includes('@');
    const user = await User.findOne(
      isEmail ? { email: identifier } : { phone: identifier }
    );

    if (!user) {
      return NextResponse.json({ error: 'No account found for this identifier' }, { status: 404 });
    }

    if (isEmail ? user.isEmailVerified : user.isPhoneVerified) {
      return NextResponse.json({ error: 'Account is already verified' }, { status: 400 });
    }

    // Invalidate all previous unused OTPs for this identifier
    await OTP.updateMany(
      { emailOrPhone: identifier, used: false },
      { $set: { used: true } }
    );

    // Generate fresh OTP
    const otpCode = generateOTP();
    const bcrypt = require('bcryptjs');
    const otpHash = await bcrypt.hash(otpCode, 10);
    await OTP.create({
      emailOrPhone: identifier,
      code: otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    // Send OTP via email
    if (isEmail) {
      try {
        await sendOtpEmail(identifier, otpCode);
      } catch (emailErr) {
        console.error('Resend email failed:', emailErr.message);
        // OTP code is NOT logged here for security
      }
    }

    return NextResponse.json({ message: 'OTP resent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    return NextResponse.json({ error: 'Failed to resend OTP' }, { status: 500 });
  }
}
