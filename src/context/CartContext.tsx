import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "../types";
import { getCart, updateCart } from "../utils/storage";

interface CartContextType {
  items: CartItem[];
  checkedItems: CartItem[];
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
  getCheckedItemsTotal: (products: Product[]) => number;
  changeCartItemSize: (productId: string, oldSize: string, newSize: string) => Promise<void>;
  toggleItemCheck: (productId: string, size: string, isChecked: boolean) => void;
  isItemChecked: (productId: string | null, size: string | null) => boolean;
  setAllItemsChecked: (checked: boolean) => void;
  getCheckedItems: () => CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cart = await getCart();
      setItems(cart.items || []);
      // Initialize all items as unchecked
      const initialCheckedState: {[key: string]: boolean} = {};
      (cart.items || []).forEach((item: CartItem) => {
        const key = `${item.productId}-${item.size}`;
        initialCheckedState[key] = false;
      });
      setCheckedItems(initialCheckedState);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    try {
      await updateCart({ items: newItems });
      setItems(newItems);
      
      // Update checkedItems to maintain only existing items
      const updatedCheckedItems: {[key: string]: boolean} = {};
      newItems.forEach(item => {
        const key = `${item.productId}-${item.size}`;
        // Keep checked state if it exists, otherwise set to false
        updatedCheckedItems[key] = checkedItems[key] || false;
      });
      setCheckedItems(updatedCheckedItems);
    } catch (error) {
      console.error("Error saving cart:", error);
      throw error;
    }
  };

  // Toggle check state of an item
  const toggleItemCheck = (productId: string, size: string, isChecked: boolean) => {
    const key = `${productId}-${size}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: isChecked
    }));
  };

  // Check if an item is checked
  const isItemChecked = (productId: string | null, size: string | null): boolean => {
    // If both params are null, check if any items are checked
    if (productId === null && size === null) {
      return Object.values(checkedItems).some(value => value);
    }
    
    // Normal case - check specific item
    const key = `${productId}-${size}`;
    return !!checkedItems[key];
  };

  // Set all items checked or unchecked
  const setAllItemsChecked = (checked: boolean) => {
    const newCheckedItems: {[key: string]: boolean} = {};
    items.forEach(item => {
      const key = `${item.productId}-${item.size}`;
      newCheckedItems[key] = checked;
    });
    setCheckedItems(newCheckedItems);
  };

  // Get all currently checked items
  const getCheckedItems = (): CartItem[] => {
    return items.filter(item => {
      const key = `${item.productId}-${item.size}`;
      return checkedItems[key];
    });
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
      // Auto-check newly added items
      const key = `${product.id}-${size}`;
      setCheckedItems(prev => ({
        ...prev,
        [key]: true
      }));
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
    setCheckedItems({});
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

  const getCheckedItemsTotal = (products: Product[]) => {
    return getCheckedItems().reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const changeCartItemSize = async (
    productId: string,
    oldSize: string,
    newSize: string
  ) => {
    const existingItem = items.find(
      (item) => item.productId === productId && item.size === oldSize
    );
    if (!existingItem) return;

    // Find the index of the old item to maintain position
    const itemIndex = items.findIndex(
      (item) => item.productId === productId && item.size === oldSize
    );
    
    // Remove old item but keep its position
    let newItems = [...items];
    newItems.splice(itemIndex, 1);
    
    // Find if new size already exists
    const newItemExists = newItems.find(
      (item) => item.productId === productId && item.size === newSize
    );

    // Remember if old item was checked
    const oldKey = `${productId}-${oldSize}`;
    const wasChecked = checkedItems[oldKey] || false;
    
    // Remove old item check state
    const newCheckedItems = {...checkedItems};
    delete newCheckedItems[oldKey];

    if (newItemExists) {
      // If the new size already exists, increase its quantity
      newItems = newItems.map((item) =>
        item.productId === productId && item.size === newSize
          ? { ...item, quantity: item.quantity + existingItem.quantity }
          : item
      );
      
      // Keep the new item checked if old was checked
      const newKey = `${productId}-${newSize}`;
      newCheckedItems[newKey] = newCheckedItems[newKey] || wasChecked;
      setCheckedItems(newCheckedItems);
    } else {
      // Insert the new item at the same position as the old one
      const newItem = {
        productId,
        size: newSize,
        quantity: existingItem.quantity,
      };
      
      newItems.splice(itemIndex, 0, newItem);
      
      // Keep check state from old item
      const newKey = `${productId}-${newSize}`;
      newCheckedItems[newKey] = wasChecked;
      setCheckedItems(newCheckedItems);
    }

    await saveCart(newItems);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        checkedItems: getCheckedItems(),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getCheckedItemsTotal,
        changeCartItemSize,
        toggleItemCheck,
        isItemChecked,
        setAllItemsChecked,
        getCheckedItems,
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
