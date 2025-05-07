import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
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

interface SalesData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    total: number;
    createdAt: string;
  }>;
}

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
    recentOrders: [],
  });
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    fetchSalesData();
  }, [timeRange]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const startDate = new Date();
      switch (timeRange) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch orders within time range
      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", startDate.toISOString()),
        orderBy("createdAt", "desc")
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate sales metrics
      const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calculate top products
      const productSales = new Map();
      orders.forEach((order) => {
        order.items.forEach((item) => {
          const current = productSales.get(item.id) || {
            quantity: 0,
            revenue: 0,
          };
          productSales.set(item.id, {
            name: item.name,
            quantity: current.quantity + item.quantity,
            revenue: current.revenue + item.price * item.quantity,
          });
        });
      });

      const topProducts = Array.from(productSales.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setSalesData({
        totalSales,
        totalOrders,
        averageOrderValue,
        topProducts,
        recentOrders: orders.slice(0, 5),
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      Alert.alert("Error", "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sales Reports</Text>
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            style={[
              styles.timeButton,
              timeRange === "week" && styles.activeTimeButton,
            ]}
            onPress={() => setTimeRange("week")}
          >
            <Text
              style={[
                styles.timeButtonText,
                timeRange === "week" && styles.activeTimeButtonText,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeButton,
              timeRange === "month" && styles.activeTimeButton,
            ]}
            onPress={() => setTimeRange("month")}
          >
            <Text
              style={[
                styles.timeButtonText,
                timeRange === "month" && styles.activeTimeButtonText,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeButton,
              timeRange === "year" && styles.activeTimeButton,
            ]}
            onPress={() => setTimeRange("year")}
          >
            <Text
              style={[
                styles.timeButtonText,
                timeRange === "year" && styles.activeTimeButtonText,
              ]}
            >
              Year
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="attach-money" size={24} color="#000" />
          <Text style={styles.statValue}>
            {formatCurrency(salesData.totalSales)}
          </Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="shopping-cart" size={24} color="#000" />
          <Text style={styles.statValue}>{salesData.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="trending-up" size={24} color="#000" />
          <Text style={styles.statValue}>
            {formatCurrency(salesData.averageOrderValue)}
          </Text>
          <Text style={styles.statLabel}>Average Order</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Products</Text>
        {salesData.topProducts.map((product, index) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productMeta}>
                {product.quantity} units sold •{" "}
                {formatCurrency(product.revenue)}
              </Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {salesData.recentOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
              <Text style={styles.orderDate}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <Text style={styles.orderAmount}>
              {formatCurrency(order.total)}
            </Text>
          </View>
        ))}
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
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  timeRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTimeButton: {
    backgroundColor: "#000",
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTimeButtonText: {
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  productMeta: {
    fontSize: 14,
    color: "#666",
  },
  rankBadge: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: "#666",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ReportsScreen;
