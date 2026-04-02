import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

/** GET /api/auth/profile — fetch full profile including addresses */
export async function GET(request) {
  try {
    const authUser = getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        addresses: true, // Include saved addresses
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
    if (phone && phone !== authUser.phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing && existing.id !== authUser.userId) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        name: name.trim(),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        addresses: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
