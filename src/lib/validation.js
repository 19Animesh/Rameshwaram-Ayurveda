import { z } from 'zod';

// Indian phone: optional +91 prefix, then 10 digits starting with 6-9
const indianPhoneRegex = /^\+?91?[6-9]\d{9}$/;
// Indian 6-digit pincode
const indianPincodeRegex = /^\d{6}$/;

export const addressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  phone: z
    .string()
    .regex(indianPhoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  street: z.string().min(1, 'Street address is required').max(200),
  city:   z.string().min(1, 'City is required').max(100),
  state:  z.string().min(1, 'State is required').max(100),
  pincode: z
    .string()
    .regex(indianPincodeRegex, 'Enter a valid 6-digit pincode'),
});

export const orderSchema = z.object({
  userId:        z.string().min(1, 'User ID is required'),
  items: z.array(z.object({
    productId: z.string().min(1),
    name:      z.string(),
    // NOTE: price & quantity here are server-authoritative values — never from client input
    price:     z.number().min(0),
    quantity:  z.number().int().min(1).max(99),
    variantId: z.string().optional().nullable(),
  })).min(1, 'Cart cannot be empty'),
  address:       addressSchema,
  paymentMethod: z.enum(['razorpay', 'cod', 'bank_transfer']),
  paymentId:     z.string().optional(),
  subtotal:      z.number().min(0),
  deliveryCharge: z.number().min(0),
  total:         z.number().min(0),
});

export const productSchema = z.object({
  id:            z.string().min(1),
  name:          z.string().min(1),
  category:      z.string().min(1),
  price:         z.number().min(0),
  originalPrice: z.number().min(0),
});
