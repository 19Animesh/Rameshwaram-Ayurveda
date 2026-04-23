import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(6),
});

export const orderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1),
    name: z.string(),
    price: z.number().min(0),
    quantity: z.number().min(1),
    variantId: z.string().optional().nullable(),
  })).min(1, 'Cart Cannot be empty'),
  address: addressSchema,
  paymentMethod: z.string().min(1),
  paymentId: z.string().optional(),
  subtotal: z.number().min(0),
  deliveryCharge: z.number().min(0),
  total: z.number().min(0),
});

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().min(0),
  originalPrice: z.number().min(0),
});
