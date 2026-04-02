import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';

const prisma = new PrismaClient();

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { name, email, password, phone } = await request.json();
    
    if (!name || (!email && !phone) || !password) {
      return NextResponse.json({ error: 'Name, password, and either email or phone are required' }, { status: 400 });
    }

    // Check if user already exists
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    
    const existingUser = await prisma.user.findFirst({
      where: { OR: query }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or phone already registered' }, { status: 409 });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create unverified user
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email || '',
        phone: phone || null,
        passwordHash,
        isEmailVerified: false,
        isPhoneVerified: false
      }
    });
    
    // Generate and save OTP
    const otpCode = generateOTP();
    const identifier = email || phone;
    
    await prisma.oTP.create({
      data: {
        emailOrPhone: identifier,
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
      }
    });
    
    // Send OTP via email
    if (email) {
      try {
        await sendOtpEmail(email, otpCode);
      } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
        // OTP code is NOT logged here for security
      }
    }
    
    return NextResponse.json({ 
      message: 'Registration successful. OTP sent.',
      requireVerification: true,
      identifier 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
