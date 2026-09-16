import { errorResponse } from '@/lib/apiResponse';

/**
 * POST /api/auth/login — REMOVED.
 *
 * Customers sign in with their mobile number and an OTP (/api/auth/verify-otp).
 * This old password route was not used by the site and was broken: it read
 * `user.id` from a lean MongoDB document, where that field does not exist, so
 * every session it created had no user id. It also still allowed passwords to
 * be guessed.
 *
 * It is kept as a stub so copying these files over an existing project cannot
 * leave the old endpoint behind. You can delete this folder entirely.
 */
export async function POST() {
  return errorResponse('Password sign-in has been removed. Please sign in with your mobile number and OTP.', 410);
}
