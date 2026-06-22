import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';

export async function POST(request) {
  try {
    // Rate limit by IP: 5 registration attempts per minute per IP
    // Extract first IP only to prevent x-forwarded-for spoofing
    const rawIp = request.headers.get('x-forwarded-for') || 'unknown';
    const ip = rawIp.split(',')[0].trim();
    if (!(await checkRateLimit(ip, 5, 60000, 'register-ip'))) {
      return errorResponse('Too many registration attempts. Please try again later.', 429);
    }

    const { name, email, password, phone, firebaseToken } = await request.json();
    
    if (!name || !phone || !password || !firebaseToken) {
      return errorResponse('Name, phone, password, and firebaseToken are required', 400);
    }

    const targetPhone = normalizePhone(phone);
    if (!targetPhone) {
      return errorResponse('Please enter a valid 10-digit mobile number.', 400);
    }

    // Rate limit by identifier: 3 registration attempts per minute per phone
    if (!(await checkRateLimit(targetPhone, 3, 60000, 'register-id'))) {
      return errorResponse('Too many registration attempts for this phone number. Please try again later.', 429);
    }

    // Verify the Firebase Token server-side
    let firebasePhone = '';
    try {
      const adminSDK = getFirebaseAdmin();
      const decodedToken = await adminSDK.auth().verifyIdToken(firebaseToken);
      firebasePhone = decodedToken.phone_number;
    } catch (tokenErr) {
      console.error('Firebase token verification failed:', tokenErr.message);
      return errorResponse('Invalid or expired phone verification token', 401);
    }

    // Ensure token phone matches the registration phone
    if (!phoneNumbersMatch(targetPhone, firebasePhone)) {
      return errorResponse('Verified phone number does not match the provided phone number', 400);
    }

    // Check if user already exists
    await connectToDatabase();
    
    const query = [];
    if (email) query.push({ email });
    query.push({ phone: targetPhone });
    
    const existingUser = await User.findOne({
      $or: query
    });

    if (existingUser) {
      return errorResponse('Email or phone already registered', 409);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create verified user directly
    const newUser = await User.create({
      name,
      ...(email ? { email } : {}),
      phone: targetPhone,
      passwordHash,
      isPhoneVerified: true // Already verified via Firebase on client
    });
    
    // Generate JWT Session Token
    const token = signToken({ userId: newUser._id.toString(), email: newUser.email, phone: newUser.phone, role: newUser.role });
    const { passwordHash: _, ...safeUser } = newUser.toObject();
    safeUser.id = newUser._id.toString();
    
    const response = successResponse({ 
      message: 'Registration successful',
      user: safeUser,
      token 
    }, 201);

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Registration Error:', error);
    return errorResponse('Registration failed');
  }
}
