import React from "react";
import { StatusBar } from "react-native";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar barStyle="dark-content" />
          <Navigation />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
