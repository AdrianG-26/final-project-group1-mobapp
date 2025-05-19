export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
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
  status: 'pending' | 'completed' | 'canceled';
  createdAt: string;
  shippingAddress: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
  };
  deliveryMethod: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sizes: string[];
  stock: Record<string, number>; // Size to stock count mapping
  featured?: boolean;
}

export type MainStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  ProductDetails: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  EditProduct: { productId?: string };
  Profile: undefined;
}; 