'use client';
/**
 * Cart and wishlist state.
 *
 * WHAT CHANGED AND WHY
 * --------------------
 * 1. The context value was a fresh object literal on every render:
 *
 *        <CartContext.Provider value={{ cart, addToCart, ... }}>
 *
 *    React compares context values by identity, so a brand-new object meant
 *    EVERY consumer re-rendered on EVERY provider render — the header, all
 *    twelve product cards, the cart page. The value is now memoised, so
 *    consumers re-render only when the data actually changes.
 *
 * 2. Every handler was recreated each render too, which defeats React.memo on
 *    any child receiving one. All are now useCallback with stable identities.
 *
 * 3. `alert()` lived inside a setState updater. React may invoke updaters twice
 *    in StrictMode (which this project enables), producing duplicate alerts,
 *    and side effects inside an updater are a correctness bug regardless. The
 *    warning is now raised outside the state transition.
 *
 * 4. localStorage was written synchronously on every keystroke-level change.
 *    Writes are now coalesced on a short timer.
 *
 * 5. Cart lookups used `Array.find` / `Array.some` on each call. An id Set is
 *    derived once per cart change instead.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';

const CartContext = createContext(null);

const CART_KEY = 'ayurvedic_cart';
const WISHLIST_KEY = 'ayurvedic_wishlist';
const PERSIST_DELAY_MS = 300;

/** Strips Mongo's `_id` and guarantees a stable string `id`. */
function normalizeProduct(product) {
  const id = product?.id || product?._id?.toString();
  if (!id) return null;
  const { _id, ...rest } = product;
  return { ...rest, id };
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notice, setNotice] = useState(null);

  // ── Hydrate from localStorage once ────────────────────────────────────
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_KEY);
      const savedWishlist = localStorage.getItem(WISHLIST_KEY);
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error('Could not restore cart from local storage:', e);
    }
    setIsInitialized(true);
  }, []);

  // ── Persist, coalesced ────────────────────────────────────────────────
  const persistTimer = useRef(null);
  useEffect(() => {
    if (!isInitialized) return;

    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      } catch (e) {
        // Quota exceeded, or storage disabled in private mode. Non-fatal.
        console.error('Could not save cart:', e);
      }
    }, PERSIST_DELAY_MS);

    return () => clearTimeout(persistTimer.current);
  }, [cart, wishlist, isInitialized]);

  // Surfaced instead of alert() so it can be rendered as a toast, and so it
  // never fires twice under StrictMode.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  // ── Derived values, computed once per change ──────────────────────────
  const cartIds = useMemo(() => new Set(cart.map((i) => i.id)), [cart]);
  const wishlistIds = useMemo(() => new Set(wishlist.map((i) => i.id)), [wishlist]);

  const { cartTotal, cartCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const item of cart) {
      total += item.price * item.quantity;
      count += item.quantity;
    }
    return { cartTotal: total, cartCount: count };
  }, [cart]);

  // ── Actions ───────────────────────────────────────────────────────────
  const addToCart = useCallback((product, quantity = 1) => {
    const normalized = normalizeProduct(product);
    if (!normalized) return;

    const maxStock = normalized.stock ?? Infinity;
    let hitStockLimit = false;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === normalized.id);

      if (existing) {
        const requested = existing.quantity + quantity;
        if (requested > maxStock) {
          hitStockLimit = true;
          if (existing.quantity === maxStock) return prev; // nothing to change
          return prev.map((item) =>
            item.id === normalized.id ? { ...item, quantity: maxStock } : item
          );
        }
        return prev.map((item) =>
          item.id === normalized.id ? { ...item, quantity: requested } : item
        );
      }

      if (quantity > maxStock) hitStockLimit = true;
      return [...prev, { ...normalized, quantity: Math.min(quantity, maxStock) }];
    });

    // Outside the updater: safe under StrictMode's double invocation.
    if (hitStockLimit) {
      setNotice(`Only ${maxStock} unit${maxStock === 1 ? '' : 's'} available.`);
    }
  }, []);

  const removeFromCart = useCallback((productId) => {
    const id = productId?.toString();
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback(
    (productId, quantity) => {
      const id = productId?.toString();
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.id !== id));
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.min(quantity, item.stock ?? Infinity) }
            : item
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setCart([]), []);

  const addToWishlist = useCallback((product) => {
    const normalized = normalizeProduct(product);
    if (!normalized) return;
    setWishlist((prev) =>
      prev.some((item) => item.id === normalized.id) ? prev : [...prev, normalized]
    );
  }, []);

  const removeFromWishlist = useCallback((productId) => {
    const id = productId?.toString();
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // O(1) set lookups rather than scanning the array on every card render.
  const isInWishlist = useCallback(
    (productId) => wishlistIds.has(productId?.toString()),
    [wishlistIds]
  );

  const isInCart = useCallback(
    (productId) => cartIds.has(productId?.toString()),
    [cartIds]
  );

  // ── Memoised context value ────────────────────────────────────────────
  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      isInCart,
      notice,
    }),
    [
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      wishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      isInCart,
      notice,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
