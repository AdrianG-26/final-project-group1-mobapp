import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Order, Product } from "../../types";
import { getProducts, saveOrder } from "../../utils/storage";
import { validateEmail } from "../../utils/validation";

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");

  // Error state
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    loadProducts();
    if (user) {
      setFullName(user.name);
      setEmail(user.email);
    }
  }, []);

  const loadProducts = async () => {
    try {
      const loadedProducts = await getProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string;
    } = {};

    if (!fullName) newErrors.fullName = "Full name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
    if (!address) newErrors.address = "Address is required";
    if (!city) newErrors.city = "City is required";
    if (!state) newErrors.state = "State is required";
    if (!zipCode) newErrors.zipCode = "ZIP code is required";
    if (!phone) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setProcessing(true);
    try {
      const order: Order = {
        id: uuidv4(),
        userId: user?.id || "",
        items: items,
        total: getTotalPrice(products),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      await saveOrder(order);
      await clearCart();
      navigation.reset({
        index: 0,
        routes: [{ name: "OrderHistory" }],
      });
    } catch (error) {
      console.error("Checkout error:", error);
      setErrors({
        email: "An error occurred. Please try again.",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Checkout</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Information</Text>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Address"
              value={address}
              onChangeText={setAddress}
              error={errors.address}
            />
            <Input
              label="City"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />
            <Input
              label="State"
              value={state}
              onChangeText={setState}
              error={errors.state}
            />
            <Input
              label="ZIP Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              error={errors.zipCode}
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.orderItems}>
              {items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;

                return (
                  <View
                    key={`${item.productId}-${item.size}`}
                    style={styles.orderItem}
                  >
                    <Text style={styles.itemName}>
                      {product.name} ({item.size})
                    </Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      ${(product.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${getTotalPrice(products).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Place Order"
          onPress={handleCheckout}
          loading={processing}
          disabled={processing}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  orderItems: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
});

export default CheckoutScreen;
