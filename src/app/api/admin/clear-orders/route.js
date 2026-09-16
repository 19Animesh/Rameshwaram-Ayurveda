import { errorResponse } from '@/lib/apiResponse';

/**
 * DELETE /api/admin/clear-orders — REMOVED.
 *
 * This deleted every order in the database with a single request. It was only
 * ever meant for clearing demo data, nothing in the admin panel uses it, and on
 * a live store one mistaken or malicious request would wipe all order history.
 *
 * It is kept as a stub so copying these files over an existing project cannot
 * leave the old endpoint behind. You can delete this folder entirely.
 */
export async function DELETE() {
  return errorResponse('This endpoint has been removed.', 410);
}
