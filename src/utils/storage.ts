import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartItem, Order, Product, User } from "../types/index";
import { syncProducts } from "./productSync";
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

// Function to sync sample products in memory
const syncSampleProducts = (products: Product[]) => {
  // Clear the array and add new products
  sampleProducts.length = 0;
  sampleProducts.push(...products);
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
    syncSampleProducts(products);
  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const storedProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (storedProducts) {
      const products = JSON.parse(storedProducts);
      syncSampleProducts(products);
      return products;
    }
    // If no stored products, initialize with sample data
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS,
      JSON.stringify(sampleProducts)
    );
    return sampleProducts;
  } catch (error) {
    console.error("Error getting products:", error);
    return sampleProducts;
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
      syncSampleProducts(products);
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
    syncSampleProducts(filteredProducts);
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
    // Get current user to make cart user-specific
    const currentUser = await getCurrentUser();
    const cartKey = currentUser
      ? `${STORAGE_KEYS.CART}_${currentUser.id}`
      : STORAGE_KEYS.CART;

    const cart = await AsyncStorage.getItem(cartKey);
    return cart ? JSON.parse(cart) : { items: [] };
  } catch (error) {
    console.error("Error getting cart:", error);
    return { items: [] };
  }
};

export const updateCart = async (cart: Record<string, any>): Promise<void> => {
  try {
    // Get current user to make cart user-specific
    const currentUser = await getCurrentUser();
    const cartKey = currentUser
      ? `${STORAGE_KEYS.CART}_${currentUser.id}`
      : STORAGE_KEYS.CART;

    await AsyncStorage.setItem(cartKey, JSON.stringify(cart));
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

// Function to get a specific order by ID
export const getOrder = async (orderId: string): Promise<Order> => {
  try {
    const orders = await getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    return order;
  } catch (error) {
    console.error("Error getting order:", error);
    throw error;
  }
};

// Function to update an existing order
export const updateOrder = async (updatedOrder: Order): Promise<void> => {
  try {
    const orders = await getOrders();
    const orderIndex = orders.findIndex((o) => o.id === updatedOrder.id);

    if (orderIndex === -1) {
      throw new Error(`Order with ID ${updatedOrder.id} not found`);
    }

    // Update the order
    orders[orderIndex] = updatedOrder;

    // Save the updated orders array
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error("Error updating order:", error);
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

// Function to update product stock with retry mechanism and optimistic locking
export const updateProductStock = async (
  items: CartItem[],
  retryCount = 3
): Promise<Product[]> => {
  try {
    // Get current products
    const products = await getProducts();

    // Verify stock availability first
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const currentStock = product.stock[item.size] || 0;
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name} in size ${item.size}`
        );
      }
    }

    // Update stock for each item in the order
    const updatedProducts = products.map((product) => {
      const orderItem = items.find((item) => item.productId === product.id);
      if (orderItem) {
        // Create a new stock object to avoid mutating the original
        const newStock = { ...product.stock };
        newStock[orderItem.size] = Math.max(
          0,
          (newStock[orderItem.size] || 0) - orderItem.quantity
        );
        return { ...product, stock: newStock };
      }
      return product;
    });

    // Save updated products
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS,
      JSON.stringify(updatedProducts)
    );
    return updatedProducts;
  } catch (error) {
    console.error("Error updating product stock:", error);

    // Retry on failure if we haven't exceeded retry count
    if (retryCount > 0) {
      console.log(
        `Retrying stock update. Attempts remaining: ${retryCount - 1}`
      );
      return updateProductStock(items, retryCount - 1);
    }

    throw error;
  }
};

export const getProduct = async (
  productId: string
): Promise<Product | null> => {
  try {
    const products = await getProducts();
    return products.find((p) => p.id === productId) || null;
  } catch (error) {
    console.error("Error getting product:", error);
    return null;
  }
};

// Add this function to update a user's password
export const updateUserPassword = async (
  email: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (userIndex !== -1) {
      // Update the user's password
      users[userIndex].password = newPassword;

      // Save the updated users list
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // If this is the current user, update the current user as well
      const currentUser = await getCurrentUser();
      if (
        currentUser &&
        currentUser.email.toLowerCase() === email.toLowerCase()
      ) {
        currentUser.password = newPassword;
        await setCurrentUser(currentUser);
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating user password:", error);
    return false;
  }
};

// Add this function to update user information
export const updateUser = async (updatedUser: User): Promise<boolean> => {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex((u) => u.id === updatedUser.id);

    if (userIndex !== -1) {
      // Update the user
      users[userIndex] = updatedUser;

      // Save the updated users list
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // If this is the current user, update the current user as well
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        await setCurrentUser(updatedUser);
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
  }
};
