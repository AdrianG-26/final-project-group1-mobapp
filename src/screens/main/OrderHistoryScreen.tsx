import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { Order, Product } from "../../types/index";
import { getOrders, getProducts, updateOrder } from "../../utils/storage";

// Define cancellation reasons
const CANCELLATION_REASONS = [
  "Changed my mind",
  "Found a better price elsewhere",
  "Ordered by mistake",
  "Delivery time too long",
  "Wrong size selected",
  "Other"
];

const OrderHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelProcessing, setCancelProcessing] = useState(false);
  const [showCustomReasonInput, setShowCustomReasonInput] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const customReasonInputRef = useRef<TextInput>(null);

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
        return "#4BB543";
      case "canceled":
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

  const handleCancelPress = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCustomReasonInput(false);
    setCustomReason("");
    setCancelModalVisible(true);
  };

  const handleReasonSelect = (reason: string) => {
    if (reason === "Other") {
      setShowCustomReasonInput(true);
      // Focus the text input after render
      setTimeout(() => {
        customReasonInputRef.current?.focus();
      }, 100);
    } else {
      handleCancelOrder(reason);
    }
  };

  const handleCancelOrder = async (reason: string) => {
    if (!selectedOrderId) return;
    
    setCancelProcessing(true);
    
    try {
      // Find the order
      const orderToCancel = orders.find(order => order.id === selectedOrderId);
      
      if (!orderToCancel) {
        Alert.alert("Error", "Order not found");
        return;
      }
      
      // Update the order status to canceled and add reason
      const updatedOrder: Order = {
        ...orderToCancel,
        status: "canceled",
        cancellationReason: reason,
        canceledAt: new Date().toISOString()
      };
      
      // Update the order in storage
      await updateOrder(updatedOrder);
      
      // Update the orders state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrderId ? updatedOrder : order
        )
      );
      
      // Close the modal
      closeModal();
      
      Alert.alert(
        "Order Canceled",
        "Your order has been successfully canceled.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error canceling order:", error);
      Alert.alert(
        "Error",
        "Failed to cancel order. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setCancelProcessing(false);
    }
  };

  const closeModal = () => {
    setCancelModalVisible(false);
    setShowCustomReasonInput(false);
    setCustomReason("");
    setSelectedOrderId(null);
  };

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    // Calculate total items in order
    const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
    
    // Check if order can be canceled (only pending orders)
    const canCancel = order.status === "pending";
    
    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
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
        
        {/* Order Items (Similar to Checkout) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.slice(0, 2).map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;
            
            return (
              <View key={`${item.productId}-${item.size}`} style={styles.parcelItem}>
                <Image 
                  source={typeof product.image === 'string' ? { uri: product.image } : product.image} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productDetails}>Size {item.size}</Text>
                  <Text style={styles.productDetails}>Quantity {item.quantity}</Text>
                  <Text style={styles.productPrice}>₱{product.price.toLocaleString()}</Text>
                </View>
              </View>
            );
          })}
          
          {/* Show count of remaining items if more than 2 */}
          {order.items.length > 2 && (
            <Text style={styles.moreItems}>
              +{order.items.length - 2} more items
            </Text>
          )}
        </View>
        
        {/* Order Summary (Similar to Checkout) */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{totalItems}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Method</Text>
            <Text style={styles.summaryValue}>
              {order.deliveryMethod === "home-delivery" ? "Home Delivery" : "Pick-up"}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping Fee</Text>
            <Text style={styles.summaryValue}>
              {order.deliveryMethod === "home-delivery" ? "₱150" : "Free"}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ₱{(order.total + (order.deliveryMethod === "home-delivery" ? 150 : 0)).toLocaleString()}
            </Text>
          </View>
          
          {/* Cancellation Reason (if order is canceled) */}
          {order.status === "canceled" && order.cancellationReason && (
            <View style={styles.cancellationContainer}>
              <Text style={styles.cancellationLabel}>Cancellation Reason:</Text>
              <Text style={styles.cancellationReason}>{order.cancellationReason}</Text>
            </View>
          )}
          
          {/* Cancel Button (only for pending orders) */}
          {canCancel && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelPress(order.id)}
            >
              <Icon name="close-circle" size={18} color="#FF3B30" style={styles.cancelIcon} />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
          <View style={styles.placeholderView}></View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <View style={styles.placeholderView}></View>
      </View>
      
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
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'HomeScreen' }]
                });
              }}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* Cancellation Reason Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showCustomReasonInput ? "Enter Cancellation Reason" : "Select Cancellation Reason"}
                </Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={closeModal}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              <ScrollView keyboardShouldPersistTaps="handled">
                {showCustomReasonInput ? (
                  // Custom reason input view
                  <View style={styles.customReasonContainer}>
                    <TextInput
                      ref={customReasonInputRef}
                      style={styles.customReasonInput}
                      placeholder="Enter your reason here..."
                      value={customReason}
                      onChangeText={setCustomReason}
                      multiline
                      maxLength={250}
                    />
                    <Text style={styles.characterCount}>
                      {customReason.length}/250
                    </Text>
                    <TouchableOpacity 
                      style={[
                        styles.submitReasonButton, 
                        !customReason.trim() && styles.disabledButton
                      ]}
                      onPress={() => handleCancelOrder(customReason.trim())}
                      disabled={!customReason.trim() || cancelProcessing}
                    >
                      <Text style={styles.submitReasonText}>Submit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={() => setShowCustomReasonInput(false)}
                      disabled={cancelProcessing}
                    >
                      <Text style={styles.backButtonText}>Back to Reasons</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // List of predefined reasons
                  CANCELLATION_REASONS.map((reason, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.reasonItem}
                      onPress={() => handleReasonSelect(reason)}
                      disabled={cancelProcessing}
                    >
                      <Text style={styles.reasonText}>{reason}</Text>
                      {reason === "Other" && (
                        <Icon name="chevron-right" size={20} color="#666" />
                      )}
                    </TouchableOpacity>
                  ))
                )}
                
                {cancelProcessing && (
                  <ActivityIndicator size="small" color="#000" style={styles.processingIndicator} />
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  backButton: {
    padding: 4,
  },
  placeholderView: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  parcelItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: "#f0f0f0"
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 4,
  },
  moreItems: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  summary: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 8,
    paddingTop: 16,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cancellationContainer: {
    backgroundColor: "#FFF3F3",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cancellationLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
    marginBottom: 4,
  },
  cancellationReason: {
    fontSize: 14,
    color: "#333",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 8,
    marginTop: 8,
  },
  cancelIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  modalCloseButton: {
    padding: 4,
  },
  reasonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reasonText: {
    fontSize: 16,
    color: "#000",
  },
  processingIndicator: {
    marginTop: 16,
  },
  // Custom reason input styles
  customReasonContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  customReasonInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    marginBottom: 8,
  },
  submitReasonButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  submitReasonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButtonText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
});

export default OrderHistoryScreen;
