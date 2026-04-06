import { NextResponse } from 'next/server';

export function successResponse(data, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message = 'Internal Server Error', status = 500, errors = null) {
  const payload = { success: false, error: message };
  if (errors) payload.details = errors;
  return NextResponse.json(payload, { status });
}
