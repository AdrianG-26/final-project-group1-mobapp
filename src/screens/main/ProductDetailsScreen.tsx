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
import { Product } from "../../types";
import { useCart } from "../../context/CartContext";

type ProductDetailsRouteProp = RouteProp<MainStackParamList, "ProductDetails">;
type ProductDetailsNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get("window");

const ProductDetailsScreen = () => {
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const route = useRoute<ProductDetailsRouteProp>();
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  // Custom notification states
  const [notificationVisible, setNotificationVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const products = await getProducts();
      const foundProduct = products.find((p) => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedSize(foundProduct.sizes[0]); // Select first size by default
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = () => {
    setNotificationVisible(true);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  };
  
  const hideNotification = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setNotificationVisible(false);
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (!selectedSize) {
      Alert.alert("Size Required", "Please select a size before adding to cart");
      return;
    }

    try {
      await addToCart(product, selectedSize);
      showNotification();
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart");
    }
  };

  // Custom notification component
  const renderNotification = () => {
    if (!notificationVisible || !product) return null;
    
    return (
      <Animated.View 
        style={[
          styles.notification,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.notificationContent} 
          onPress={() => {
            hideNotification();
            navigation.navigate("Cart");
          }}
        >
          <View style={styles.notificationIconContainer}>
            <Icon name="check-circle" size={24} color="#fff" />
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>Added to Cart</Text>
            <Text style={styles.notificationMessage}>{product.name} (Size: {selectedSize})</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderNotification()}
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate("Cart")}
          >
            <Icon name="cart-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <Image source={{ uri: product.image }} style={styles.image} />

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.brand}>QUECHUA</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₱{product.price.toLocaleString()}</Text>
            <Text style={styles.originalPrice}>
              ₱{(product.price * 1.25).toLocaleString()}
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Icon name="star" size={20} color="#000" />
            <Text style={styles.rating}>4.4</Text>
            <Text style={styles.ratingCount}>(4,089 reviews)</Text>
          </View>

          {/* Size Selection */}
          <Text style={styles.sectionTitle}>Select Size</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sizesContainer}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.selectedSizeButton,
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === size && styles.selectedSizeText,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
        >
          <Icon name="cart-plus" size={24} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  cartButton: {
    padding: 8,
  },
  image: {
    width: width,
    height: width,
    resizeMode: "cover",
  },
  infoContainer: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  originalPrice: {
    fontSize: 18,
    color: "#666",
    textDecorationLine: "line-through",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 24,
  },
  rating: {
    fontSize: 16,
    color: "#000",
  },
  ratingCount: {
    fontSize: 16,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  sizesContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  sizeButton: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedSizeButton: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  sizeText: {
    fontSize: 16,
    color: "#000",
  },
  selectedSizeText: {
    color: "#fff",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  notification: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#50C878",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});

export default ProductDetailsScreen;
