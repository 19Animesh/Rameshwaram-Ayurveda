import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import OTP from '@/models/OTP';
import bcrypt from 'bcryptjs';
import { sendOtpEmail } from '@/lib/mailer';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper to generate a 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    // Rate limit by IP: 5 registration attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 5, 60000, 'register-ip'))) {
      return errorResponse('Too many registration attempts. Please try again later.', 429);
    }

    const { name, email, password, phone } = await request.json();
    
    if (!name || (!email && !phone) || !password) {
      return errorResponse('Name, password, and either email or phone are required', 400);
    }

    // Rate limit by identifier: 3 registration attempts per minute per email/phone
    const identifier = email || phone;
    if (!(await checkRateLimit(identifier, 3, 60000, 'register-id'))) {
      return errorResponse('Too many registration attempts for this email or phone. Please try again later.', 429);
    }

    // Check if user already exists
    await connectToDatabase();
    
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });
    
    const existingUser = await User.findOne({
      $or: query
    });

    if (existingUser) {
      return errorResponse('Email or phone already registered', 409);
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create unverified user
    const newUser = await User.create({
      name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      passwordHash,
      isPhoneVerified: false
    });
    
    // Generate and save OTP
    const otpCode = generateOTP();
    const otpHash = await bcrypt.hash(otpCode, 10);
    
    await OTP.create({
      emailOrPhone: identifier,
      code: otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
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
    
    return successResponse({ 
      message: 'Registration successful. OTP sent.',
      requireVerification: true,
      identifier 
    }, 201);
    
  } catch (error) {
    console.error('Registration Error:', error);
    return errorResponse('Registration failed');
  }
}
