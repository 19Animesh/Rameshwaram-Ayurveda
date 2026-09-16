/**
 * POST /api/auth/verify-otp
 *
 * OTP login. The browser completes Firebase phone verification, then sends the
 * resulting Firebase ID token here. This route verifies that token server-side
 * and issues a session JWT.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. Removed the development "test number" bypass. It was added because
 *    verifyIdToken kept failing, but the real cause was a malformed
 *    FIREBASE_PRIVATE_KEY (fixed in lib/firebaseAdmin.js). Firebase test
 *    numbers produce normal ID tokens that verify fine. The bypass also
 *    accepted ANY string as a token for that number — with admin-by-phone,
 *    that would have been a password-free admin login.
 *
 * 2. Admin by phone number (see lib/adminPhones.js). If the verified number
 *    is on the admin list, the session gets admin access, and an account is
 *    created automatically the first time that number signs in.
 *
 * 3. "No account" responses carry `details.code = 'NO_ACCOUNT'` so the login
 *    page can offer a link to registration.
 *
 * 4. In development, verification failures return the real reason instead of
 *    a generic "code expired" message that hid the private-key problem.
 */
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getFirebaseAdmin, isPhoneVerificationConfigured } from '@/lib/firebaseAdmin';
import { signToken } from '@/lib/auth';
import { successResponse, errorResponse, failure } from '@/lib/apiResponse';
import { checkRateLimit } from '@/lib/rateLimit';
import { setSessionCookies } from '@/lib/session';
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';
import { isAdminPhone, resolveSessionRole } from '@/lib/adminPhones';

export const dynamic = 'force-dynamic';

const isDev = process.env.NODE_ENV !== 'production';

/** Creates the account for an admin number that has never signed in. */
async function createAdminAccount(phone) {
  try {
    return await User.create({
      name: 'Admin',
      phone,
      isPhoneVerified: true,
    });
  } catch (err) {
    // Two sign-ins at the same moment: the other request created it first.
    if (err?.code === 11000) return User.findOne({ phone });
    throw err;
  }
}

export async function POST(request) {
  try {
    if (!isPhoneVerificationConfigured()) {
      console.error('[verify-otp] Firebase Admin is not configured.');
      return errorResponse('Phone verification is not available yet.', 503);
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!(await checkRateLimit(ip, 10, 60000, 'verify-otp-ip'))) {
      return errorResponse('Too many verification attempts. Please try again shortly.', 429);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Request body must be valid JSON', 400);
    }

    const { identifier, firebaseToken } = body || {};
    if (!identifier || !firebaseToken) {
      return errorResponse('Phone number and verification token are required.', 400);
    }

    const targetPhone = normalizePhone(identifier);
    if (!targetPhone) {
      return errorResponse('That does not look like a valid phone number.', 400);
    }

    if (!(await checkRateLimit(targetPhone, 5, 60000, 'verify-otp-id'))) {
      return errorResponse(
        'Too many verification attempts for this number. Please wait a minute and try again.',
        429
      );
    }

    // ── Verify the Firebase ID token ──────────────────────────────────────
    let firebasePhone = '';
    try {
      const decoded = await getFirebaseAdmin().auth().verifyIdToken(firebaseToken);
      firebasePhone = decoded.phone_number || '';
    } catch (tokenErr) {
      if (tokenErr?.isConfigurationError) {
        console.error('[verify-otp]', tokenErr.message);
        return errorResponse(
          isDev ? tokenErr.message : 'Phone verification is temporarily unavailable.',
          503
        );
      }
      console.error('[verify-otp] token verification failed:', {
        code: tokenErr?.code,
        message: tokenErr?.message,
      });
      return errorResponse(
        isDev
          ? `Server could not verify the OTP session: ${tokenErr?.message}`
          : 'We could not verify your OTP. Please request a new code and try again.',
        401
      );
    }

    if (!firebasePhone) {
      return errorResponse('That verification token does not contain a phone number.', 400);
    }

    if (!phoneNumbersMatch(targetPhone, firebasePhone)) {
      return errorResponse('The verified number does not match the number you entered.', 400);
    }

    // From here on the number is proven to belong to the person signing in.

    // ── Find (or, for admin numbers, create) the account ──────────────────
    await connectToDatabase();

    // Accounts may predate normalisation, so match either stored form.
    const last10 = targetPhone.replace(/\D/g, '').slice(-10);
    let user = await User.findOne({
      $or: [{ phone: targetPhone }, { phone: last10 }, { phone: `+91${last10}` }],
    });

    if (!user && isAdminPhone(targetPhone)) {
      user = await createAdminAccount(targetPhone);
    }

    if (!user) {
      return errorResponse(
        'No account exists for this number yet. Please create an account first.',
        404,
        { code: 'NO_ACCOUNT' }
      );
    }

    // Normalise the stored number and mark it verified. updateOne skips
    // schema validation, so older documents missing a field cannot block login.
    if (user.phone !== targetPhone || !user.isPhoneVerified) {
      await User.updateOne(
        { _id: user._id },
        { $set: { phone: targetPhone, isPhoneVerified: true } }
      );
      user.phone = targetPhone;
      user.isPhoneVerified = true;
    }

    // ── Issue the session ─────────────────────────────────────────────────
    const { role, adminViaPhone } = resolveSessionRole(user.role, targetPhone);

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      phone: targetPhone,
      role,
      ...(adminViaPhone ? { adminViaPhone: true } : {}),
    });

    const { passwordHash: _ignored, __v: _v, _id, ...safeUser } = user.toObject();
    safeUser.id = _id.toString();
    safeUser.role = role;

    const response = successResponse({ user: safeUser, token });
    return setSessionCookies(response, token);
  } catch (error) {
    return failure(error, 'Verification failed');
  }
}
