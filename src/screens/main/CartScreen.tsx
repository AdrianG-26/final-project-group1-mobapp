import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Button from "../../components/Button";
import { useCart } from "../../context/CartContext";
import { MainStackParamList } from "../../types";
import { Product } from "../../types/index";
import { getProducts } from "../../utils/storage";

type CartScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const CartScreen = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    getCheckedItemsTotal, 
    changeCartItemSize,
    toggleItemCheck,
    isItemChecked, 
    setAllItemsChecked,
    getCheckedItems
  } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{productId: string, currentSize: string, quantity: number} | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const loadedProducts = await getProducts();
      setProducts(loadedProducts);
      // Initially select all items
      setAllItemsChecked(true);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (
    productId: string,
    size: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      confirmRemoveItem(productId, size);
      return;
    }
    await updateQuantity(productId, size, newQuantity);
  };

  const confirmRemoveItem = (productId: string, size: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    
    Alert.alert(
      "Remove Item",
      `Remove ${product.name} from your cart?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: () => handleRemoveItem(productId, size),
          style: "destructive"
        }
      ]
    );
  };

  const handleRemoveItem = async (productId: string, size: string) => {
    try {
      await removeFromCart(productId, size);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleSizePress = (productId: string, currentSize: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct({ productId, currentSize, quantity });
      setSizeModalVisible(true);
    }
  };

  const handleSizeChange = async (newSize: string) => {
    if (!selectedProduct) return;
    
    const { productId, currentSize, quantity } = selectedProduct;
    
    try {
      // Get check state before changing
      const wasChecked = isItemChecked(productId, currentSize);
      
      // Change the size in the cart
      await changeCartItemSize(productId, currentSize, newSize);
      
      // Apply the same check state to new item
      if (wasChecked) {
        toggleItemCheck(productId, newSize, true);
      }
    } catch (error) {
      console.error("Error changing size:", error);
    } finally {
      setSizeModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleToggleItem = (productId: string, size: string) => {
    toggleItemCheck(productId, size, !isItemChecked(productId, size));
  };

  const handleToggleAll = () => {
    // If all items are currently selected, unselect all
    // Otherwise, select all items
    setAllItemsChecked(!areAllItemsSelected());
  };

  // Check if any items are selected
  const hasSelectedItems = (): boolean => {
    return getCheckedItems().length > 0;
  };
  
  // Check if all items are selected
  const areAllItemsSelected = (): boolean => {
    return getCheckedItems().length === items.length && items.length > 0;
  };

  const renderSizeModal = () => {
    if (!selectedProduct) return null;
    
    const product = products.find(p => p.id === selectedProduct.productId);
    if (!product) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={sizeModalVisible}
        onRequestClose={() => {
          setSizeModalVisible(false);
          setSelectedProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Size</Text>
              <TouchableOpacity 
                onPress={() => {
                  setSizeModalVisible(false);
                  setSelectedProduct(null);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.sizeList}>
              {product.sizes.map((size) => {
                const isCurrentSize = size === selectedProduct.currentSize;
                const isAvailable = product.stock[size] > 0;
                
                return (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeOption,
                      isCurrentSize && styles.selectedSizeOption,
                      !isAvailable && styles.unavailableSizeOption
                    ]}
                    onPress={() => {
                      if (!isCurrentSize && isAvailable) {
                        handleSizeChange(size);
                      }
                    }}
                    disabled={!isAvailable}
                  >
                    <Text style={[
                      styles.sizeOptionText,
                      isCurrentSize && styles.selectedSizeOptionText,
                      !isAvailable && styles.unavailableSizeOptionText
                    ]}>
                      {size}{!isAvailable && " (OOS)"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderItem = ({
    item,
  }: {
    item: { productId: string; size: string; quantity: number };
  }) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;

    const isSelected = isItemChecked(item.productId, item.size);

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleItem(item.productId, item.size)}
        >
          <Icon
            name={isSelected ? "checkbox-marked" : "checkbox-blank-outline"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
        <Image 
          source={typeof product.image === 'string' ? { uri: product.image } : product.image} 
          style={styles.itemImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.itemOptions}>
            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Size</Text>
              <TouchableOpacity 
                style={styles.optionValue}
                onPress={() => handleSizePress(item.productId, item.size, item.quantity)}
              >
                <Text style={styles.optionText}>{item.size}</Text>
                <Icon name="chevron-down" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={[styles.optionContainer, styles.quantityWrapper]}>
              <Text style={styles.optionLabel}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() =>
                    handleQuantityChange(item.productId, item.size, item.quantity - 1)
                  }
                  style={styles.quantityButton}
                >
                  <Icon name="minus" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  onPress={() =>
                    handleQuantityChange(item.productId, item.size, item.quantity + 1)
                  }
                  style={styles.quantityButton}
                  disabled={item.quantity >= (product.stock[item.size] || 0)}
                >
                  <Icon 
                    name="plus" 
                    size={16} 
                    color={item.quantity >= (product.stock[item.size] || 0) ? "#ccc" : "#000"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <Text style={styles.itemPrice}>₱{product.price.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          onPress={() => confirmRemoveItem(item.productId, item.size)}
          style={styles.removeButton}
        >
          <Icon name="trash-can-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate the total price for selected items only
  const getSelectedItemsTotal = () => {
    return items.reduce((total, item) => {
      if (!isItemChecked(item.productId, item.size)) {
        return total;
      }
      
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };
  
  // Calculate the total number of selected items
  const getSelectedItemsCount = () => {
    return items.reduce((total, item) => {
      if (!isItemChecked(item.productId, item.size)) {
        return total;
      }
      return total + item.quantity;
    }, 0);
  };
  
  const selectedTotal = getSelectedItemsTotal();
  const selectedItemsCount = getSelectedItemsCount();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <Text style={styles.title}>Cart</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {items.length > 0 ? (
        <>
          <TouchableOpacity
            style={styles.selectAllContainer}
            onPress={handleToggleAll}
          >
            <Icon
              name={areAllItemsSelected() ? "checkbox-marked" : "checkbox-blank-outline"}
              size={24}
              color="#000"
            />
            <Text style={styles.selectAllText}>Select all</Text>
          </TouchableOpacity>

          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.productId}-${item.size}`}
            contentContainerStyle={styles.list}
            extraData={[getCheckedItems().length, products]} // Add products to trigger re-render when they load
          />

          <View style={styles.footer}>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Selected</Text>
                <Text style={styles.summaryValue}>{selectedItemsCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₱{selectedTotal.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₱{selectedTotal.toLocaleString()}</Text>
              </View>
            </View>

            <Button
              title="Continue to Checkout"
              onPress={() => navigation.navigate("Checkout")}
              style={styles.checkoutButton}
              textStyle={styles.checkoutButtonText}
              disabled={!hasSelectedItems()}
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="cart-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Button
            title="Start Shopping"
            onPress={() => navigation.navigate("HomeScreen")}
            variant="outline"
            style={styles.emptyButton}
          />
        </View>
      )}
      {renderSizeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  selectAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectAllText: {
    fontSize: 16,
    color: "#000",
  },
  list: {
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  itemDetails: {
    flex: 1,
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  itemOptions: {
    gap: 12,
  },
  optionContainer: {
    gap: 4,
  },
  optionLabel: {
    fontSize: 14,
    color: "#666",
  },
  optionValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
    color: "#000",
  },
  quantityWrapper: {
    width: '50%',
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    overflow: "hidden",
    width: 100,
  },
  quantityButton: {
    padding: 8,
  },
  quantity: {
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#000",
    minWidth: 30,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: -15,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  summaryContainer: {
    gap: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    color: "#000",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
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
  checkoutButton: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCloseButton: {
    padding: 4,
  },
  sizeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  sizeOption: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSizeOption: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  unavailableSizeOption: {
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
  },
  sizeOptionText: {
    fontSize: 16,
    color: '#000',
  },
  selectedSizeOptionText: {
    color: '#fff',
  },
  unavailableSizeOptionText: {
    color: '#ccc',
  },
});

export default CartScreen;