import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Address from '@/models/Address';
import { getUserFromRequest } from '@/lib/auth';

/** GET /api/auth/profile — fetch full profile including addresses */
export async function GET(request) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const userRaw = await User.findById(authUser.userId).lean();
    if (!userRaw) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Fetch related addresses
    const addressesRaw = await Address.find({ userId: authUser.userId }).lean();
    const addresses = addressesRaw.map(a => ({ ...a, id: a._id.toString() }));
    
    const { _id, passwordHash, ...safeUser } = userRaw;
    const user = { ...safeUser, id: _id.toString(), addresses };

    // Done above

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/** PUT /api/auth/profile — update name and/or phone for the logged-in user */
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

    // Check phone uniqueness (if provided and changed)
    await connectToDatabase();
    
    // Check phone uniqueness
    if (phone && phone !== authUser.phone) {
      const existing = await User.findOne({ phone }).lean();
      if (existing && existing._id.toString() !== authUser.userId) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 });
      }
    }

    const dataToUpdate = {
      name: name.trim(),
      ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
    };
    
    const updatedRaw = await User.findByIdAndUpdate(authUser.userId, dataToUpdate, { new: true }).lean();
    
    // Fetch addresses for updated user output to match Prisma shape
    const addressesRaw = await Address.find({ userId: authUser.userId }).lean();
    const addresses = addressesRaw.map(a => ({ ...a, id: a._id.toString() }));
    
    const { _id, passwordHash, ...safeUpdated } = updatedRaw;
    const updated = { ...safeUpdated, id: _id.toString(), addresses };

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
