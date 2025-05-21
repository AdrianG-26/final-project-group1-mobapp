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
  const { addToCart, items } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

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

    // Add a focus listener to reload product data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadProduct();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [route.params.productId]);

  // Calculate remaining stock considering items in cart
  const getRemainingStock = (size: string) => {
    if (!product) return 0;
    
    const currentStock = product.stock[size] || 0;
    const inCart = items.find(item => item.productId === product.id && item.size === size);
    const cartQuantity = inCart ? inCart.quantity : 0;
    
    // Return the actual stock minus what's in cart
    return Math.max(0, currentStock - cartQuantity);
  };

  const handleQuantityChange = (increment: boolean) => {
    if (!selectedSize) return;
    
    const remainingStock = getRemainingStock(selectedSize);
    
    if (increment && quantity < remainingStock) {
      setQuantity(prev => prev + 1);
    } else if (!increment && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !selectedSize) {
      Alert.alert("Error", "Please select a size before adding to cart");
      return;
    }

    const remainingStock = getRemainingStock(selectedSize);
    const inCart = items.find(item => item.productId === product.id && item.size === selectedSize);
    const cartQuantity = inCart ? inCart.quantity : 0;

    if (cartQuantity + quantity > remainingStock) {
      Alert.alert(
        "Stock Limit Reached",
        `You can only add ${remainingStock - cartQuantity} more of this item in this size to your cart.`
      );
      return;
    }

    try {
      await addToCart(product, selectedSize, quantity);
      
      // Reset quantity after adding to cart
      setQuantity(1);
      
      // Reset animation value first
      toastAnim.setValue(0);
      setShowToast(true);
      
      // Start fade-in animation
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Set timer for fade-out
      const timer = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowToast(false);
        });
      }, 2500);
      
      // Clean up timer if component unmounts
      return () => clearTimeout(timer);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  };

  const handleToastPress = () => {
    navigation.navigate("Cart");
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.headerButton}>
          <Icon name="cart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {showToast && (
        <Animated.View 
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })
              }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.toastContent} 
            onPress={handleToastPress}
            activeOpacity={0.9}
          >
            <Icon name="check-circle" size={24} color="#fff" />
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>Added to Cart</Text>
              <Text style={styles.toastMessage}>Tap to view your cart</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={showToast ? { paddingTop: 0 } : undefined}>
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
            {selectedSize && (
              <>
                <Text style={styles.stockCount}>
                  {product.stock[selectedSize]} {product.stock[selectedSize] === 1 ? 'stock' : 'stocks'} remaining
                </Text>
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      onPress={() => handleQuantityChange(false)}
                      style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                      disabled={quantity <= 1}
                    >
                      <Icon name="minus" size={20} color={quantity <= 1 ? "#ccc" : "#000"} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{quantity}</Text>
                    <TouchableOpacity 
                      onPress={() => handleQuantityChange(true)}
                      style={[
                        styles.quantityButton, 
                        quantity >= getRemainingStock(selectedSize) && styles.quantityButtonDisabled
                      ]}
                      disabled={quantity >= getRemainingStock(selectedSize)}
                    >
                      <Icon name="plus" size={20} color={quantity >= getRemainingStock(selectedSize) ? "#ccc" : "#000"} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 2,
  },
  headerButton: {
    padding: 8,
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
  toast: {
    position: 'absolute',
    top: 60, // Just below header
    left: 16,
    right: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  toastTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toastMessage: {
    color: '#eee',
    fontSize: 14,
  },
  quantityContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quantityButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  quantityText: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stockCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'left',
    marginBottom: 16,
  },
});

export default ProductDetailsScreen;
