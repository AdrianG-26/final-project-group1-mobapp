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

  const getSaleTagColor = (discount: number) => {
    if (discount >= 40) return "#FF4444"; // Red for high discounts (40% and above)
    if (discount >= 25) return "#FF8C00"; // Dark Orange for medium-high discounts (25-39%)
    if (discount >= 15) return "#FFD700"; // Gold for medium discounts (15-24%)
    return "#90EE90"; // Light Green for low discounts (below 15%)
  };

  const hasDiscount = product.discount !== undefined;
  const discountedPrice = hasDiscount 
    ? Math.round(product.price * (1 - product.discount! / 100))
    : product.price;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={typeof product.image === 'string' ? { uri: product.image } : product.image} style={styles.image} />
        {hasDiscount && (
          <View style={[styles.saleTag, { backgroundColor: getSaleTagColor(product.discount!) }]}>
            <Text style={styles.saleText}>{product.discount}% Off</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.brand}>{product.brand || 'Unknown Brand'}</Text>
        <Text style={styles.gender}>{product.gender}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₱{discountedPrice.toLocaleString()}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>
              ₱{product.price.toLocaleString()}
            </Text>
          )}
        </View>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#ffbb00" />
          <Text style={styles.rating}>{product.rating || '0.0'}</Text>
          <Text style={styles.ratingCount}>({product.ratingCount || 0})</Text>
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
    width: cardWidth,
    marginHorizontal: 8,
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
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  gender: {
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
