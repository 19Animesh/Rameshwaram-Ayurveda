import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Address from '@/models/Address';
import { getUserFromRequest } from '@/lib/auth';
import { normalizePhone, phoneNumbersMatch } from '@/lib/phone';

export const dynamic = 'force-dynamic';

/**
 * The role the browser should see. Admin-by-phone lives in the verified
 * session token rather than the database (see lib/adminPhones.js), so the
 * token's role is used when it grants admin. The stored phone is deliberately
 * NOT checked here: users can edit it below without an OTP.
 */
function sessionRole(authUser, dbUser) {
  if (authUser?.role === 'admin') return 'admin';
  return dbUser?.role || 'user';
}

/** GET /api/auth/profile — fetch full profile including addresses */
export async function GET(request) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ user: null });
    }

    await connectToDatabase();
    const userRaw = await User.findById(authUser.userId).lean();
    if (!userRaw) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Fetch related addresses
    const addressesRaw = await Address.find({ userId: authUser.userId }).lean();
    const addresses = addressesRaw.map(a => ({ ...a, id: a._id.toString() }));
    
    const { _id, passwordHash: _passwordHash, ...safeUser } = userRaw;
    const user = { ...safeUser, id: _id.toString(), role: sessionRole(authUser, userRaw), addresses };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PUT /api/auth/profile — update the logged-in user's name.
 *
 * The phone number can no longer be changed here. It is the sign-in identity
 * and is proven by OTP. Previously any number could be saved without
 * verification, so someone could attach a stranger's unregistered number to
 * their own account; when that person later signed in with OTP they landed in
 * that account, and their orders and addresses became visible to its creator.
 */
export async function PUT(request) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectToDatabase();

    const current = await User.findById(authUser.userId).lean();
    if (!current) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Older clients still send `phone`. Accept it only if it is the same number.
    if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
      const requested = normalizePhone(phone);
      if (!requested || !current.phone || !phoneNumbersMatch(requested, current.phone)) {
        return NextResponse.json(
          { error: 'Your mobile number is used to sign in and cannot be changed here. Please contact support to change it.' },
          { status: 400 }
        );
      }
    }

    const updatedRaw = await User.findByIdAndUpdate(
      authUser.userId,
      { name: name.trim() },
      { new: true }
    ).lean();

    // Fetch addresses for updated user output to match Prisma shape
    const addressesRaw = await Address.find({ userId: authUser.userId }).lean();
    const addresses = addressesRaw.map(a => ({ ...a, id: a._id.toString() }));
    
    const { _id, passwordHash: _passwordHash, ...safeUpdated } = updatedRaw;
    const updated = { ...safeUpdated, id: _id.toString(), role: sessionRole(authUser, updatedRaw), addresses };

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
