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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Button from "../../components/Button";
import { useCart } from "../../context/CartContext";
import { MainStackParamList, Product } from "../../types";
import { getProducts } from "../../utils/storage";

type CartScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const CartScreen = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
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

  const handleQuantityChange = async (
    productId: string,
    size: string,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    await updateQuantity(productId, size, newQuantity);
  };

  const handleRemoveItem = async (productId: string, size: string) => {
    await removeFromCart(productId, size);
  };

  const renderItem = ({
    item,
  }: {
    item: { productId: string; size: string; quantity: number };
  }) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;

    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: product.image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{product.name}</Text>
          <Text style={styles.itemSize}>Size: {item.size}</Text>
          <Text style={styles.itemPrice}>${product.price.toFixed(2)}</Text>
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() =>
              handleQuantityChange(item.productId, item.size, item.quantity - 1)
            }
            style={styles.quantityButton}
          >
            <Icon name="minus" size={20} color="#000" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() =>
              handleQuantityChange(item.productId, item.size, item.quantity + 1)
            }
            style={styles.quantityButton}
          >
            <Icon name="plus" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveItem(item.productId, item.size)}
          style={styles.removeButton}
        >
          <Icon name="close" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {items.length > 0 ? (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.productId}-${item.size}`}
            contentContainerStyle={styles.list}
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>
                ${getTotalPrice(products).toFixed(2)}
              </Text>
            </View>
            <Button
              title="Proceed to Checkout"
              onPress={() => navigation.navigate("Checkout")}
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
    </SafeAreaView>
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
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginHorizontal: 12,
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
});

export default CartScreen;
