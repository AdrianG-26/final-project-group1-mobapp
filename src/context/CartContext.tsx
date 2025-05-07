import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "../types";
import { getCart, updateCart } from "../utils/storage";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (
    productId: string,
    size: string,
    quantity: number
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: (products: Product[]) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cart = await getCart();
      setItems(cart.items || []);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    try {
      await updateCart({ items: newItems });
      setItems(newItems);
    } catch (error) {
      console.error("Error saving cart:", error);
      throw error;
    }
  };

  const addToCart = async (product: Product, size: string) => {
    const existingItem = items.find(
      (item) => item.productId === product.id && item.size === size
    );

    let newItems: CartItem[];
    if (existingItem) {
      newItems = items.map((item) =>
        item.productId === product.id && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newItems = [...items, { productId: product.id, size, quantity: 1 }];
    }

    await saveCart(newItems);
  };

  const removeFromCart = async (productId: string, size: string) => {
    const newItems = items.filter(
      (item) => !(item.productId === productId && item.size === size)
    );
    await saveCart(newItems);
  };

  const updateQuantity = async (
    productId: string,
    size: string,
    quantity: number
  ) => {
    if (quantity < 1) {
      await removeFromCart(productId, size);
      return;
    }

    const newItems = items.map((item) =>
      item.productId === productId && item.size === size
        ? { ...item, quantity }
        : item
    );
    await saveCart(newItems);
  };

  const clearCart = async () => {
    await saveCart([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (products: Product[]) => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
