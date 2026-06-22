import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';

export async function POST(request) {
  try {
    // Rate limit by IP: 10 verify attempts per minute per IP
    // Extract first IP only to prevent x-forwarded-for spoofing
    const rawIp = request.headers.get('x-forwarded-for') || 'unknown';
    const ip = rawIp.split(',')[0].trim();
    if (!(await checkRateLimit(ip, 10, 60000, 'verify-otp-ip'))) {
      return errorResponse('Too many verification attempts. Please try again later.', 429);
    }

    const { identifier, firebaseToken } = await request.json();

    if (!identifier || !firebaseToken) {
      return errorResponse('Phone number and firebaseToken are required', 400);
    }

    // Format phone number to E.164 for database query and matching
    const targetPhone = normalizePhone(identifier);
    if (!targetPhone) {
      return errorResponse('Valid 10-digit mobile number is required', 400);
    }

    // Rate limit by identifier: 5 verify attempts per minute per phone number
    if (!(await checkRateLimit(targetPhone, 5, 60000, 'verify-otp-id'))) {
      return errorResponse('Too many verification attempts for this account. Please try again later.', 429);
    }

    // Verify the Firebase Token server-side
    let firebasePhone = '';
    try {
      const adminSDK = getFirebaseAdmin();
      const decodedToken = await adminSDK.auth().verifyIdToken(firebaseToken);
      firebasePhone = decodedToken.phone_number;
    } catch (tokenErr) {
      console.error('Firebase token verification failed:', tokenErr.message);
      return errorResponse('Invalid or expired verification token', 401);
    }

    // Ensure the token's phone matches the user's phone identifier
    if (!phoneNumbersMatch(targetPhone, firebasePhone)) {
      return errorResponse('Verified phone number does not match the provided phone number', 400);
    }

    await connectToDatabase();
    
    // Find the user strictly by phone number
    const existingUser = await User.findOne({ phone: targetPhone });

    if (!existingUser) {
      return errorResponse('User not found', 404);
    }

    // Mark verified
    const userRaw = await User.findByIdAndUpdate(
      existingUser._id, 
      { isPhoneVerified: true }, 
      { new: true }
    ).lean();
    
    const user = { ...userRaw, id: userRaw._id.toString() };

    // Generate JWT Session Token
    const token = signToken({ userId: user.id, email: user.email, phone: user.phone, role: user.role });

    const { passwordHash: _, ...safeUser } = user;

    const response = successResponse({ user: safeUser, token });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    return response;
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return errorResponse('Verification failed');
  }
}
