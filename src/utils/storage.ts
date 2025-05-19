import AsyncStorage from "@react-native-async-storage/async-storage";
import { Order, Product, User } from "../types";
import { sampleProducts } from "./sampleData";

// Storage keys
const STORAGE_KEYS = {
  USERS: "users",
  PRODUCTS: "products",
  ORDERS: "orders",
  CURRENT_USER: "currentUser",
  CART: "cart",
  HAS_SEEN_ONBOARDING: "hasSeenOnboarding",
};

// Initialize sample data
export const initializeSampleData = async (): Promise<void> => {
  try {
    // Always initialize with the latest sample data during development
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS,
      JSON.stringify(sampleProducts)
    );
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
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

// Add this function to your storage.ts file
export const makeUserAdmin = async (email: string): Promise<boolean> => {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (userIndex !== -1) {
      // Update the user to be an admin
      users[userIndex].isAdmin = true;

      // Save the updated users list
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // If this is the current user, update the current user as well
      const currentUser = await getCurrentUser();
      if (
        currentUser &&
        currentUser.email.toLowerCase() === email.toLowerCase()
      ) {
        currentUser.isAdmin = true;
        await setCurrentUser(currentUser);
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error making user admin:", error);
    return false;
  }
};

// Add this function to delete a user
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const users = await getUsers();
    const initialLength = users.length;

    // Filter out the user with the matching ID
    const updatedUsers = users.filter((user) => user.id !== userId);

    // If no user was removed, return false
    if (updatedUsers.length === initialLength) {
      return false;
    }

    // Save the updated users list
    await AsyncStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(updatedUsers)
    );

    // Check if the deleted user is the current user
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      // Log out the current user if they were deleted
      await setCurrentUser(null);
    }

    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
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

// Add a getOrder function to fetch a single order by ID
export const getOrder = async (orderId: string): Promise<any> => {
  try {
    const orders = await getOrders();
    return orders.find((order) => order.id === orderId) || null;
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
};

// Generic storage functions for key-value pairs
export const storeValue = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error storing value for ${key}:`, error);
    throw error;
  }
};

export const getStoredValue = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Error retrieving value for ${key}:`, error);
    return null;
  }
};
