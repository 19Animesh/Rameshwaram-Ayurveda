'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ayurvedic_cart');
      const savedWishlist = localStorage.getItem('ayurvedic_wishlist');
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error('Failed to parse cart/wishlist from local storage', e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('ayurvedic_cart', JSON.stringify(cart));
    }
  }, [cart, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('ayurvedic_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isInitialized]);

  const addToCart = (product, quantity = 1) => {
    const productId = product.id || product._id?.toString();
    if (!productId) return;

    const normalizedProduct = {
      ...product,
      id: productId,
    };
    if (normalizedProduct._id) {
      delete normalizedProduct._id;
    }

    const maxStock = normalizedProduct.stock ?? Infinity;
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > maxStock) {
          alert(`Only ${maxStock} units available in stock.`);
          return prev.map(item =>
            item.id === productId ? { ...item, quantity: maxStock } : item
          );
        }
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: newQty }
            : item
        );
      }
      const clampedQty = Math.min(quantity, maxStock);
      return [...prev, { ...normalizedProduct, quantity: clampedQty }];
    });
  };

  const removeFromCart = (productId) => {
    const id = productId?.toString();
    setCart(prev => prev.filter(item => (item.id || item._id?.toString()) !== id));
  };

  const updateQuantity = (productId, quantity) => {
    const id = productId?.toString();
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        (item.id || item._id?.toString()) === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToWishlist = (product) => {
    const productId = product.id || product._id?.toString();
    if (!productId) return;
    
    const normalizedProduct = {
      ...product,
      id: productId,
    };
    if (normalizedProduct._id) {
      delete normalizedProduct._id;
    }

    setWishlist(prev => {
      if (prev.find(item => item.id === productId)) return prev;
      return [...prev, normalizedProduct];
    });
  };

  const removeFromWishlist = (productId) => {
    const id = productId?.toString();
    setWishlist(prev => prev.filter(item => (item.id || item._id?.toString()) !== id));
  };

  const isInWishlist = (productId) => {
    const id = productId?.toString();
    return wishlist.some(item => (item.id || item._id?.toString()) === id);
  };

  const isInCart = (productId) => {
    const id = productId?.toString();
    return cart.some(item => (item.id || item._id?.toString()) === id);
  };

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart,
      cartTotal, cartCount, wishlist, addToWishlist, removeFromWishlist,
      isInWishlist, isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
