import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { db } from "../../services/firebase";
import { Order } from "../../types";

const OrderDetailScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const orderDoc = await getDoc(doc(db, "orders", orderId));
      if (orderDoc.exists()) {
        setOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
      } else {
        Alert.alert("Error", "Order not found");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      Alert.alert("Success", "Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#FFA000";
      case "processing":
        return "#1976D2";
      case "shipped":
        return "#7B1FA2";
      case "delivered":
        return "#388E3C";
      case "cancelled":
        return "#D32F2F";
      default:
        return "#757575";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="event" size={20} color="#666" />
          <Text style={styles.infoText}>
            Ordered on {formatDate(order.createdAt)}
          </Text>
        </View>
        {order.updatedAt && (
          <View style={styles.infoRow}>
            <Icon name="update" size={20} color="#666" />
            <Text style={styles.infoText}>
              Last updated on {formatDate(order.updatedAt)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="person" size={20} color="#666" />
            <Text style={styles.infoText}>{order.shippingInfo.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="phone" size={20} color="#666" />
            <Text style={styles.infoText}>{order.shippingInfo.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="email" size={20} color="#666" />
            <Text style={styles.infoText}>{order.shippingInfo.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <View style={styles.infoCard}>
          <Text style={styles.addressText}>{order.shippingInfo.address}</Text>
          <Text style={styles.addressText}>
            {order.shippingInfo.city}, {order.shippingInfo.state}{" "}
            {order.shippingInfo.zipCode}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemDetail}>Size: {item.size}</Text>
              <Text style={styles.itemDetail}>Quantity: {item.quantity}</Text>
              <Text style={styles.itemDetail}>
                Subtotal: ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusActions}>
          {order.status === "pending" && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.processButton]}
                onPress={() => updateOrderStatus("processing")}
              >
                <Text style={styles.actionButtonText}>Process Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => updateOrderStatus("cancelled")}
              >
                <Text style={styles.actionButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === "processing" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.shipButton]}
              onPress={() => updateOrderStatus("shipped")}
            >
              <Text style={styles.actionButtonText}>Mark as Shipped</Text>
            </TouchableOpacity>
          )}
          {order.status === "shipped" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={() => updateOrderStatus("delivered")}
            >
              <Text style={styles.actionButtonText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  addressText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  itemCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  itemDetail: {
    fontSize: 14,
    color: "#666",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  statusActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  processButton: {
    backgroundColor: "#1976D2",
  },
  cancelButton: {
    backgroundColor: "#D32F2F",
  },
  shipButton: {
    backgroundColor: "#7B1FA2",
  },
  deliverButton: {
    backgroundColor: "#388E3C",
  },
});

export default OrderDetailScreen;
