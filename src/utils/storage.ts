import AsyncStorage from "@react-native-async-storage/async-storage";
import { Order, Product, User } from "../types";

// Storage keys
const STORAGE_KEYS = {
  USERS: "users",
  PRODUCTS: "products",
  ORDERS: "orders",
  CURRENT_USER: "currentUser",
  CART: "cart",
  HAS_SEEN_ONBOARDING: "hasSeenOnboarding",
};

// User operations
export const saveUser = async (user: User): Promise<void> => {
  try {
    const users = await getUsers();
    users.push(user);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const setCurrentUser = async (user: User | null): Promise<void> => {
  try {
    if (user) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(user)
      );
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (error) {
    console.error("Error setting current user:", error);
    throw error;
  }
};

// Product operations
export const saveProduct = async (product: Product): Promise<void> => {
  try {
    const products = await getProducts();
    products.push(product);
    await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const products = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return products ? JSON.parse(products) : [];
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
};

export const updateProduct = async (product: Product): Promise<void> => {
  try {
    const products = await getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(products)
      );
    }
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const products = await getProducts();
    const filteredProducts = products.filter((p) => p.id !== productId);
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS,
      JSON.stringify(filteredProducts)
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// Order operations
export const saveOrder = async (order: Order): Promise<void> => {
  try {
    const orders = await getOrders();
    orders.push(order);
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const orders = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
    return orders ? JSON.parse(orders) : [];
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const orders = await getOrders();
    return orders.filter((order) => order.userId === userId);
  } catch (error) {
    console.error("Error getting user orders:", error);
    return [];
  }
};

// Cart operations
export const getCart = async (): Promise<Record<string, any>> => {
  try {
    const cart = await AsyncStorage.getItem(STORAGE_KEYS.CART);
    return cart ? JSON.parse(cart) : {};
  } catch (error) {
    console.error("Error getting cart:", error);
    return {};
  }
};

export const updateCart = async (cart: Record<string, any>): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (error) {
    console.error("Error updating cart:", error);
    throw error;
  }
};

// Onboarding
export const hasSeenOnboarding = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_ONBOARDING);
    return value === "true";
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
};
