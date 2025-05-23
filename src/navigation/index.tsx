import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { View } from "react-native";

// Auth Screens
import OnboardingScreen from "../screens/OnboardingScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";

// Main Screens
import AdminDashboardScreen from "../screens/main/AdminDashboardScreen";
import CartScreen from "../screens/main/CartScreen";
import CheckoutScreen from "../screens/main/CheckoutScreen";
import HomeScreen from "../screens/main/HomeScreen";
import OrderHistoryScreen from "../screens/main/OrderHistoryScreen";
import ProductDetailsScreen from "../screens/main/ProductDetailsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import PersonalInfoScreen from "../screens/main/PersonalInfoScreen";

// Admin Screens
import UserManagementScreen from "../screens/admin/UserManagementScreen";
import ProductManagementScreen from "../screens/admin/ProductManagementScreen";
import AddProduct from "../screens/admin/AddProduct";
import EditProduct from "../screens/admin/EditProduct";

// Types
import {
  AuthStackParamList,
  MainStackParamList,
  RootStackParamList,
} from "../types/index";

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();
const CartStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
};

const CartStackNavigator = () => {
  return (
    <CartStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <CartStack.Screen name="CartScreen" component={CartScreen} />
    </CartStack.Navigator>
  );
};

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <HomeStack.Screen name="Cart" component={CartScreen} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <HomeStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </HomeStack.Navigator>
  );
};

const ProfileStackScreen = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
    </ProfileStack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="MainTabs" component={TabNavigator} />
    </MainStack.Navigator>
  );
};

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen
          name="UserManagement"
          component={UserManagementScreen}
          options={{ title: "User Management" }}
        />
        <Stack.Screen
          name="ProductManagement"
          component={ProductManagementScreen}
          options={{ title: "Product Management" }}
        />
        <Stack.Screen
          name="AddProduct"
          component={AddProduct}
          options={{ title: "Add Product" }}
        />
        <Stack.Screen
          name="EditProduct"
          component={EditProduct}
          options={{ title: "Edit Product" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
