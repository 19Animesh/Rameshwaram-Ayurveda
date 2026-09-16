import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getFirebaseAdmin, isPhoneVerificationConfigured } from '@/lib/firebaseAdmin';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse, failure } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';
import { setSessionCookies } from '@/lib/session';
import { resolveSessionRole } from '@/lib/adminPhones';

const isDev = process.env.NODE_ENV !== 'production';

export async function POST(request) {
  try {
    // Registration requires phone verification, so refuse clearly when it is
    // not set up rather than failing later with a misleading 401 about tokens.
    if (!isPhoneVerificationConfigured()) {
      console.error('[register] Firebase Admin is not configured.');
      return errorResponse(
        'Account registration is temporarily unavailable. Please contact us on WhatsApp to place an order.',
        503
      );
    }

    // Rate limit by IP: 5 registration attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 5, 60000, 'register-ip'))) {
      return errorResponse('Too many registration attempts. Please try again later.', 429);
    }

    // Accounts are OTP-only, so no password is collected. (Older clients may
    // still send one; it is ignored.)
    const { name, email, phone, firebaseToken } = await request.json();

    if (!name || !String(name).trim() || !phone || !firebaseToken) {
      return errorResponse('Name, phone number and phone verification are all required.', 400);
    }

    // Store one canonical form (+91XXXXXXXXXX). Without this, the same person
    // could register twice as "9632324141" and "+919632324141".
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return errorResponse('That does not look like a valid phone number.', 400);
    }

    // Rate limit by identifier: 3 registration attempts per minute per phone
    if (!(await checkRateLimit(normalizedPhone, 3, 60000, 'register-id'))) {
      return errorResponse('Too many registration attempts for this phone number. Please try again later.', 429);
    }

    // Verify the Firebase token server-side
    let firebasePhone = '';
    try {
      const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(firebaseToken);
      firebasePhone = decodedToken.phone_number || '';
    } catch (tokenErr) {
      if (tokenErr?.isConfigurationError) {
        console.error('[register]', tokenErr.message);
        return errorResponse(
          isDev ? tokenErr.message : 'Account registration is temporarily unavailable.',
          503
        );
      }
      console.warn('[register] token rejected:', tokenErr?.code, tokenErr?.message);
      return errorResponse(
        isDev
          ? `Server could not verify the OTP session: ${tokenErr?.message}`
          : 'We could not verify your OTP. Please request a new code and try again.',
        401
      );
    }

    // Ensure token phone matches the registration phone
    if (!phoneNumbersMatch(normalizedPhone, firebasePhone)) {
      return errorResponse('Verified phone number does not match the provided phone number', 400);
    }

    // Check if user already exists
    await connectToDatabase();

    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    const last10 = normalizedPhone.replace(/\D/g, '').slice(-10);
    const query = [{ phone: normalizedPhone }, { phone: last10 }];
    if (cleanEmail) query.push({ email: cleanEmail });

    const existingUser = await User.findOne({ $or: query });

    if (existingUser) {
      return errorResponse(
        'This phone number or email is already registered. Please sign in instead.',
        409,
        { code: 'ALREADY_REGISTERED' }
      );
    }

    // Create verified user directly
    const newUser = await User.create({
      name: String(name).trim(),
      ...(cleanEmail ? { email: cleanEmail } : {}),
      phone: normalizedPhone,
      isPhoneVerified: true, // Already verified via Firebase above
    });

    // Admin numbers (lib/adminPhones.js) get admin access from the first session.
    const { role, adminViaPhone } = resolveSessionRole(newUser.role, normalizedPhone);

    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      phone: newUser.phone,
      role,
      ...(adminViaPhone ? { adminViaPhone: true } : {}),
    });

    const { passwordHash: _, __v: _v, _id, ...safeUser } = newUser.toObject();
    safeUser.id = _id.toString();
    safeUser.role = role;

    const response = successResponse({
      message: 'Registration successful',
      user: safeUser,
      token,
    }, 201);

    return setSessionCookies(response, token);
  } catch (error) {
    return failure(error, 'Registration failed');
  }
}
