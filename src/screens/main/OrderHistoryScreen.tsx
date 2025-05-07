import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList, Order, Product } from "../../types";
import { getOrders, getProducts } from "../../utils/storage";

const OrderHistoryScreen = () => {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<MainStackParamList, "OrderHistory">
    >();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedOrders, loadedProducts] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);

      // Filter orders for current user
      const userOrders = loadedOrders.filter(
        (order) => order.userId === user?.id
      );
      // Sort orders by date (newest first)
      const sortedOrders = userOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(sortedOrders);
      setProducts(loadedProducts);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "#34C759";
      case "cancelled":
        return "#FF3B30";
      default:
        return "#FF9500";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const getOrderItems = () => {
      return order.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;

        return (
          <View key={`${item.productId}-${item.size}`} style={styles.orderItem}>
            <Text style={styles.itemName}>
              {product.name} ({item.size})
            </Text>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>
              ${(product.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        );
      });
    };

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          // Navigate to order details if needed
        }}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>{getOrderItems()}</View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="package-variant" size={64} color="#666" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() =>
                navigation.navigate("MainTabs", { screen: "Home" })
              }
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  orderItems: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OrderHistoryScreen;
