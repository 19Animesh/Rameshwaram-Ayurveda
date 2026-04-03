import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadImage } from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Fetch product and its variants from SQLite
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Fetch Product Error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    // Admin guard
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Whitelist only fields that exist in the Prisma Product schema
    const allowed = ['name','brand','category','description','rating','reviewCount',
      'originalPrice','price','stock','expiryDate','dosage','howToConsume','sideEffects','image','featured'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }

    if (safeUpdates.image && safeUpdates.image.startsWith('data:image/')) {
      safeUpdates.image = await uploadImage(safeUpdates.image) || existing.image;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: safeUpdates,
      include: { variants: true }
    });
    
    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('Update Product Error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Admin guard
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    await prisma.product.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
