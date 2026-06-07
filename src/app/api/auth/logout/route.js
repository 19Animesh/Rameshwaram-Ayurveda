import { successResponse } from '@/lib/apiResponse';

export async function POST() {
  const response = successResponse({ message: 'Logged out successfully' });
  
  // Clear the httpOnly token cookie
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0), // expire immediately
    path: '/',
  });
  
  return response;
}
