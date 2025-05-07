import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";

// Auth Screens
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// Customer Screens
import CartScreen from "../screens/CartScreen";
import HomeScreen from "../screens/HomeScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Admin Screens
import AddEditProductScreen from "../screens/admin/AddEditProductScreen";
import DashboardScreen from "../screens/admin/DashboardScreen";
import OrderDetailScreen from "../screens/admin/OrderDetailScreen";
import AdminOrdersScreen from "../screens/admin/OrdersScreen";
import ProductsScreen from "../screens/admin/ProductsScreen";
import ReportsScreen from "../screens/admin/ReportsScreen";
import UsersScreen from "../screens/admin/UsersScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomerTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case "Home":
            iconName = "home";
            break;
          case "Orders":
            iconName = "receipt";
            break;
          case "Cart":
            iconName = "shopping-cart";
            break;
          case "Profile":
            iconName = "person";
            break;
          default:
            iconName = "home";
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#666",
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Cart" component={CartScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case "Dashboard":
            iconName = "dashboard";
            break;
          case "Products":
            iconName = "inventory";
            break;
          case "Orders":
            iconName = "receipt";
            break;
          case "Users":
            iconName = "people";
            break;
          case "Reports":
            iconName = "bar-chart";
            break;
          default:
            iconName = "dashboard";
        }

        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: "#000",
      tabBarInactiveTintColor: "#666",
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Products" component={ProductsScreen} />
    <Tab.Screen name="Orders" component={AdminOrdersScreen} />
    <Tab.Screen name="Users" component={UsersScreen} />
    <Tab.Screen name="Reports" component={ReportsScreen} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : user?.role === "admin" ? (
          <>
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
            <Stack.Screen
              name="AddEditProduct"
              component={AddEditProductScreen}
              options={{
                headerShown: true,
                title: "Add/Edit Product",
              }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{
                headerShown: true,
                title: "Order Details",
              }}
            />
          </>
        ) : (
          <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
