import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import { uploadImage, deleteImage } from '@/lib/cloudinary';
import { getUserFromRequest } from '@/lib/auth';

import { successResponse, errorResponse } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = params; // No await needed in Next.js 14
    
    await connectToDatabase();
    const productRaw = await Product.findById(id).lean();
    if (!productRaw) {
      return errorResponse('Product not found', 404);
    }
    const { _id, ...rest } = productRaw;
    const product = { ...rest, id: _id.toString() };
    
    if (!product) {
      return errorResponse('Product not found', 404);
    }
    
    return successResponse({ product });
  } catch (error) {
    console.error('Fetch Product Error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return errorResponse(isDev ? error.message : 'Failed to fetch product');
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params; // No await needed in Next.js 14

    // Admin guard
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      console.warn('PUT /products/:id - Unauthorized attempt', { id });
      return errorResponse('Unauthorized', 401);
    }
    console.log('Admin updating product', { userId: authUser.id, productId: id });

    const updates = await request.json();
    
    await connectToDatabase();
    const existing = await Product.findById(id).lean();
    if (!existing) {
      return errorResponse('Product not found', 404);
    }
    
    // ✅ Whitelist matches ACTUAL Prisma schema fields (brandId, brandName, usage — NOT brand/howToConsume)
    const allowed = [
      'name', 'brandId', 'brandName', 'category', 'description',
      'rating', 'reviewCount', 'originalPrice', 'price', 'stock',
      'expiryDate', 'dosage', 'usage', 'sideEffects',
      'imageUrl', 'imagePublicId', 'featured'
    ];
    const safeUpdates = {};
    for (const key of allowed) {
      if (key in updates) safeUpdates[key] = updates[key];
    }
    console.log('PUT fields being written:', { safeUpdates });

    // Handle Image Replacement
    if (updates.image && (updates.image.startsWith('data:image/') || updates.image.startsWith('http'))) {
      try {
        // 1. Delete old image if it exists
        if (existing.imagePublicId) {
          await deleteImage(existing.imagePublicId);
        }
        
        // 2. Upload new image with deterministic publicId
        const slug = (existing.name || 'product')
          .toString().toLowerCase().trim()
          .replace(/\s+/g, '_').replace(/[^\w-]+/g, '');
        const brandId = updates.brandId || existing.brandId || '27';
        const deterministicId = `${slug}_${brandId}`;
        const { url, publicId } = await uploadImage(updates.image, 'products', deterministicId);
        safeUpdates.imageUrl = url;
        safeUpdates.imagePublicId = publicId;
      } catch (uploadErr) {
        console.error('Image upload error during PUT:', uploadErr);
        return errorResponse(uploadErr.message, 400);
      }
    }

    const updatedRaw = await Product.findByIdAndUpdate(id, safeUpdates, { new: true }).lean();
    const { _id, ...rest } = updatedRaw;
    const updatedProduct = { ...rest, id: _id.toString() };
    
    return successResponse({ product: updatedProduct });
  } catch (error) {
    console.error('Update Product Error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return errorResponse(isDev ? error.message : 'Failed to update product');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params; // No await needed in Next.js 14

    // Admin guard
    const authUser = getUserFromRequest(request);
    if (!authUser || authUser.role !== 'admin') {
      return errorResponse('Unauthorized', 401);
    }
    
    await connectToDatabase();
    const existing = await Product.findById(id).lean();
    if (!existing) {
      return errorResponse('Product not found', 404);
    }

    // 1. Delete image from Cloudinary
    if (existing.imagePublicId) {
      await deleteImage(existing.imagePublicId);
    }
    
    // 2. Delete product from DB
    await Product.findByIdAndDelete(id);
    
    return successResponse({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    const isDev = process.env.NODE_ENV !== 'production';
    return errorResponse(isDev ? error.message : 'Failed to delete product');
  }
}
