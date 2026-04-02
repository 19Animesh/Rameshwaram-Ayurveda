/**
 * src/lib/api.js
 * Thin fetch wrappers with auth header injection and error normalisation.
 * Import these in page components instead of writing raw fetch calls.
 */

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ayurvedic_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Products ──────────────────────────────────────────────────────────
export async function fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/products${qs ? '?' + qs : ''}`);
  return handleResponse(res);
}

export async function fetchProduct(id) {
  const res = await fetch(`/api/products/${id}`);
  return handleResponse(res);
}

// ── Orders ────────────────────────────────────────────────────────────
export async function fetchOrders(userId) {
  const res = await fetch(`/api/orders?userId=${userId}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function placeOrder(payload) {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// ── Profile ───────────────────────────────────────────────────────────
export async function updateProfile(payload) {
  const res = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
