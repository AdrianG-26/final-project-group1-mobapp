import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MainStackParamList } from "../../types";
import { getProducts } from "../../utils/storage";
import { Product } from "../../types/index";
import { useCart } from "../../context/CartContext";

type ProductDetailsRouteProp = RouteProp<MainStackParamList, "ProductDetails">;
type ProductDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get("window");

const ProductDetailsScreen = () => {
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const route = useRoute<ProductDetailsRouteProp>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const products = await getProducts();
        const foundProduct = products.find((p) => p.id === route.params.productId);
        if (foundProduct) {
          setProduct(foundProduct);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        } else {
          setError("Product not found");
        }
      } catch (err) {
        setError("Failed to load product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [route.params.productId]);

  const handleAddToCart = async () => {
    if (!product || !selectedSize) {
      Alert.alert("Error", "Please select a size before adding to cart");
      return;
    }

    try {
      await addToCart(product, selectedSize);
      Alert.alert("Success", "Item added to cart successfully");
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Product not found"}</Text>
      </View>
    );
  }

  const hasDiscount = product.discount !== undefined;
  const discountedPrice = hasDiscount
    ? Math.round(product.price * (1 - (product.discount as number) / 100))
    : product.price;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Image
            source={typeof product.image === 'string' ? { uri: product.image } : product.image}
            style={styles.image}
          />
          <View style={styles.detailsContainer}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.brand}>{product.brand}</Text>
            <Text style={styles.description}>{product.description}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₱{discountedPrice.toLocaleString()}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>
                  ₱{product.price.toLocaleString()}
                </Text>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={20} color="#FFD700" />
              <Text style={styles.rating}>{product.rating}</Text>
              <Text style={styles.ratingCount}>({product.ratingCount} reviews)</Text>
            </View>
            <Text style={styles.sizesTitle}>Available Sizes:</Text>
            <View style={styles.sizesContainer}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.selectedSize,
                    product.stock[size] === 0 && styles.outOfStock,
                  ]}
                  onPress={() => setSelectedSize(size)}
                  disabled={product.stock[size] === 0}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.selectedSizeText,
                      product.stock[size] === 0 && styles.outOfStockText,
                    ]}
                  >
                    {size}
                  </Text>
                  {product.stock[size] === 0 && (
                    <Text style={styles.outOfStockLabel}>Out of Stock</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                !selectedSize && styles.disabledButton,
              ]}
              onPress={handleAddToCart}
              disabled={!selectedSize}
            >
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  content: {
    flex: 1,
  },
  image: {
    width: width,
    height: width,
    resizeMode: "cover",
  },
  detailsContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  brand: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#444",
    marginBottom: 16,
    lineHeight: 24,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: "#666",
    textDecorationLine: "line-through",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  rating: {
    fontSize: 18,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  sizesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sizesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sizeButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 60,
    alignItems: "center",
  },
  selectedSize: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  outOfStock: {
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  sizeText: {
    fontSize: 16,
  },
  selectedSizeText: {
    color: "#fff",
  },
  outOfStockText: {
    color: "#999",
  },
  outOfStockLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  addToCartButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ddd",
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProductDetailsScreen;
