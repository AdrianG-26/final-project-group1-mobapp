import React from "react";
import { StatusBar } from "react-native";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import Navigation from "./src/navigation";

// Define custom toast config to support clickable toasts
const toastConfig = {
  // @ts-expect-error - Suppressing type check to maintain original toast behavior
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#4BB543' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
      onPress={props.onPress}
    />
  ),
  // @ts-expect-error - Suppressing type check to maintain original toast behavior
  error: (props) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FF3B30' }}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar barStyle="dark-content" />
          <Navigation />
          <Toast config={toastConfig} />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
