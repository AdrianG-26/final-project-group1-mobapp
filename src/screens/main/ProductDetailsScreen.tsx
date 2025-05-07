import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Button from "../../components/Button";
import { useCart } from "../../context/CartContext";
import { Product } from "../../types";
import { getProducts } from "../../utils/storage";

const { width } = Dimensions.get("window");

const ProductDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const { productId } = route.params as { productId: string };
      const products = await getProducts();
      const foundProduct = products.find((p) => p.id === productId);

      if (foundProduct) {
        setProduct(foundProduct);
        if (foundProduct.sizes.length > 0) {
          setSelectedSize(foundProduct.sizes[0]);
        }
      } else {
        setError("Product not found");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !selectedSize) return;

    try {
      await addToCart(product, selectedSize);
      navigation.navigate("Cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError("Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "Product not found"}</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Size</Text>
            <View style={styles.sizes}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.selectedSize,
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
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock</Text>
            <Text style={styles.stock}>
              {product.stock} {product.stock === 1 ? "item" : "items"} available
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Add to Cart"
          onPress={handleAddToCart}
          disabled={!selectedSize}
        />
      </View>
    </View>
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff3b30",
    marginBottom: 20,
    textAlign: "center",
  },
  image: {
    width: width,
    height: width,
    resizeMode: "cover",
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  sizes: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    margin: 4,
  },
  selectedSize: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  sizeText: {
    fontSize: 14,
    color: "#000",
  },
  selectedSizeText: {
    color: "#fff",
  },
  stock: {
    fontSize: 16,
    color: "#666",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
});

export default ProductDetailsScreen;
