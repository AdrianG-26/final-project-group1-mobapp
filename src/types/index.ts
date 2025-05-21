export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | number;
  category: string;
  sizes: string[];
  stock: {
    [key: string]: number;
  };
  rating: number;
  ratingCount: number;
  brand: string;
  gender: "Men's" | "Women's" | "Unisex";
  discount?: number;
}

export interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "pending" | "completed" | "canceled";
  createdAt: string;
  deliveryMethod: string;
  paymentMethod: string;
  paymentDetails?: {
    cardNumber?: string;
    cardHolderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
  };
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
}

export interface OnboardingSlide {
  id: string;
  image: string;
  title: string;
  description: string;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  UserManagement: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  MainTabs: { screen?: string; params?: object } | undefined;
  HomeTab: { screen: string } | undefined;
  ProfileTab: { screen: string } | undefined;
  HomeScreen: undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  Profile: undefined;
  AdminDashboard: undefined;
  UserManagement: undefined;
  Auth: undefined;
  PersonalInfo: undefined;
};
