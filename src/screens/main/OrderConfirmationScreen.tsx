import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Button from "../../components/Button";
import { MainStackParamList, Order } from "../../types";
import { getOrder } from "../../utils/storage";

type OrderConfirmationRouteProp = RouteProp<
  MainStackParamList,
  "OrderConfirmation"
>;

type OrderConfirmationNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "OrderConfirmation"
>;

const OrderConfirmationScreen = () => {
  const navigation = useNavigation<OrderConfirmationNavigationProp>();
  const route = useRoute<OrderConfirmationRouteProp>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={80} color="#4BB543" />
        </View>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.message}>
          Your order has been placed successfully.
        </Text>
        <Text style={styles.orderNumber}>Order #{orderId.slice(0, 8)}</Text>
        
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryTitle}>
            {order?.deliveryMethod === "home-delivery" 
              ? "Your order will be delivered to:" 
              : "Pick up your order at:"}
          </Text>
          <Text style={styles.deliveryAddress}>
            {order?.shippingAddress?.fullName}
          </Text>
          <Text style={styles.deliveryAddressDetail}>
            {order?.shippingAddress?.address}, {order?.shippingAddress?.city}
          </Text>
          <Text style={styles.deliveryAddressDetail}>
            {order?.shippingAddress?.state}, {order?.shippingAddress?.zipCode}
          </Text>
        </View>

        <View style={styles.deliveryDate}>
          <Icon name="calendar-clock" size={24} color="#000" style={styles.dateIcon} />
          <View>
            <Text style={styles.dateLabel}>
              {order?.deliveryMethod === "home-delivery" 
                ? "Estimated Delivery" 
                : "Ready for Pickup"}
            </Text>
            <Text style={styles.date}>
              {order?.deliveryMethod === "home-delivery" 
                ? "Saturday, 24 May" 
                : "Monday, 19 May"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Track Order"
            onPress={() =>
              navigation.navigate("OrderDetails", { orderId: orderId })
            }
            style={styles.primaryButton}
          />
          <Button
            title="Continue Shopping"
            onPress={() => navigation.navigate("HomeScreen")}
            variant="outline"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </SafeAreaView>
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
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 32,
  },
  deliveryInfo: {
    alignSelf: "stretch",
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  deliveryAddressDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  deliveryDate: {
    flexDirection: "row",
    alignSelf: "stretch",
    alignItems: "center",
    marginBottom: 40,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  buttonContainer: {
    alignSelf: "stretch",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#000",
  },
  secondaryButton: {
    borderColor: "#000",
  },
});

export default OrderConfirmationScreen; 