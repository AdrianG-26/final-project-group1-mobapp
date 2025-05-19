import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MainStackParamList, Product } from "../types";

interface ProductCardProps {
  product: Product;
  style?: any;
}

type ProductCardNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // 2 columns with padding

const ProductCard: React.FC<ProductCardProps> = ({ product, style }) => {
  const navigation = useNavigation<ProductCardNavigationProp>();

  const handlePress = () => {
    navigation.navigate("ProductDetails", { productId: product.id });
  };

  const discountPrice = product.price * 0.8; // 20% discount for demo
  const hasDiscount = true; // For demo purposes

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
        {hasDiscount && (
          <View style={styles.saleTag}>
            <Text style={styles.saleText}>Sale</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.brand}>QUECHUA</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₱{product.price.toLocaleString()}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>
              ₱{(product.price * 1.25).toLocaleString()}
            </Text>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#000" />
          <Text style={styles.rating}>4.4</Text>
          <Text style={styles.ratingCount}>(4,089)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: cardWidth,
    resizeMode: "cover",
  },
  saleTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    color: "#000",
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  originalPrice: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "line-through",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: "#000",
  },
  ratingCount: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
});

export default ProductCard;
