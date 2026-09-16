import { successResponse } from '@/lib/apiResponse';
import { clearSessionCookies } from '@/lib/session';

export async function POST() {
  const response = successResponse({ message: 'Logged out successfully' });
  return clearSessionCookies(response);
}
