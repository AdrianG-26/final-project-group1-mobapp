import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  style?: any;
}

const { width } = Dimensions.get("window");
const cardWidth = (width - 48) / 2; // 2 columns with padding

const ProductCard: React.FC<ProductCardProps> = ({ product, style }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("ProductDetails", { productId: product.id });
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth }, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: product.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <View style={styles.sizes}>
          {product.sizes.slice(0, 3).map((size) => (
            <View key={size} style={styles.sizeTag}>
              <Text style={styles.sizeText}>{size}</Text>
            </View>
          ))}
          {product.sizes.length > 3 && (
            <Text style={styles.moreSizes}>+{product.sizes.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  image: {
    width: "100%",
    height: cardWidth,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: "cover",
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  sizes: {
    flexDirection: "row",
    alignItems: "center",
  },
  sizeTag: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  sizeText: {
    fontSize: 12,
    color: "#666",
  },
  moreSizes: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});

export default ProductCard;
