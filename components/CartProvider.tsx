"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const CART_STORAGE_KEY = "tf1shop_cart";

export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  stock: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isReady: boolean;
  itemCount: number;
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartSnapshot {
  items: CartItem[];
  isReady: boolean;
}

const serverSnapshot: CartSnapshot = { items: [], isReady: false };
let cartSnapshot = serverSnapshot;
const cartListeners = new Set<() => void>();

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

function getCartSnapshot() {
  return cartSnapshot;
}

function notifyCartListeners() {
  for (const listener of cartListeners) {
    listener();
  }
}

function setCartSnapshot(items: CartItem[], isReady = true) {
  cartSnapshot = { items, isReady };
  notifyCartListeners();
}

function parseStoredCart(value: string | null): CartItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        typeof item.imageUrl === "string" &&
        typeof item.price === "number" &&
        Number.isSafeInteger(item.price) &&
        item.price >= 0 &&
        typeof item.stock === "number" &&
        Number.isSafeInteger(item.stock) &&
        item.stock >= 0 &&
        typeof item.quantity === "number" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= item.stock,
    );
  } catch {
    return [];
  }
}

function loadCartFromStorage(value = window.localStorage.getItem(CART_STORAGE_KEY)) {
  setCartSnapshot(parseStoredCart(value));
}

function saveCart(items: CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  setCartSnapshot(items);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { items, isReady } = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    () => serverSnapshot,
  );

  useEffect(() => {
    loadCartFromStorage();

    function syncCart(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY) {
        loadCartFromStorage(event.newValue);
      }
    }

    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">) => {
      if (!cartSnapshot.isReady) {
        loadCartFromStorage();
      }
      const existing = cartSnapshot.items.find(
        (cartItem) => cartItem.productId === item.productId,
      );
      if ((existing?.quantity ?? 0) >= item.stock) {
        return false;
      }

      const items = cartSnapshot.items;
      const match = items.find(
        (cartItem) => cartItem.productId === item.productId,
      );
      saveCart(
        match
          ? items.map((cartItem) =>
              cartItem.productId === item.productId
                ? {
                    ...item,
                    quantity: Math.min(cartItem.quantity + 1, item.stock),
                  }
                : cartItem,
            )
          : [...items, { ...item, quantity: 1 }],
      );
      return true;
    },
    [],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const items =
      quantity <= 0
        ? cartSnapshot.items.filter((item) => item.productId !== productId)
        : cartSnapshot.items.flatMap((item) => {
            if (item.productId !== productId) {
              return [item];
            }
            if (item.stock < 1) {
              return [];
            }
            return [{ ...item, quantity: Math.min(quantity, item.stock) }];
          });
    saveCart(items);
  }, []);

  const removeItem = useCallback((productId: string) => {
    saveCart(
      cartSnapshot.items.filter((item) => item.productId !== productId),
    );
  }, []);

  const clearCart = useCallback(() => saveCart([]), []);

  const value = useMemo(
    () => ({
      items,
      isReady,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, isReady, items, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}
