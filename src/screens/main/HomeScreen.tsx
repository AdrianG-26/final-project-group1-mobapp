import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ProductCard from "../../components/ProductCard";
import FilterModal from "../../components/FilterModal";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList, Product } from "../../types";
import { getProducts, initializeSampleData } from "../../utils/storage";

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isAdmin } = useAuth();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({
    sortBy: '',
    discounts: [],
    gender: [],
    types: []
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await initializeSampleData();
      const products = await getProducts();
      console.log('Number of products loaded:', products.length);
      setAllProducts(products);
      setDisplayedProducts(products);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const searchProducts = (query: string) => {
    setSearchInput(query);
    applyFilters(query, activeFilters);
  };

  const applyFilters = (query: string, filters: any) => {
    let filtered = [...allProducts];

    // Apply search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply gender filter
    if (filters.gender.length > 0) {
      filtered = filtered.filter(product => filters.gender.includes(product.gender));
    }

    // Apply discount filter
    if (filters.discounts.length > 0) {
      filtered = filtered.filter(product => {
        if (!product.discount) return false;
        if (filters.discounts.includes('20-30')) {
          if (product.discount >= 20 && product.discount <= 30) return true;
        }
        if (filters.discounts.includes('30-40')) {
          if (product.discount >= 30 && product.discount <= 40) return true;
        }
        return false;
      });
    }

    // Apply type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter(product => 
        filters.types.includes(product.category.toLowerCase())
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const priceA = a.discount 
          ? Math.round(a.price * (1 - a.discount / 100))
          : a.price;
        const priceB = b.discount
          ? Math.round(b.price * (1 - b.discount / 100))
          : b.price;
        
        return filters.sortBy === 'low-high'
          ? priceA - priceB
          : priceB - priceA;
      });
    }

    setDisplayedProducts(filtered);
  };

  const handleFilterApply = (filters: any) => {
    setActiveFilters(filters);
    applyFilters(searchInput, filters);
  };

  const renderHeader = () => (
    <View style={styles.resultsHeader}>
      <Text style={styles.resultCount}>
        {displayedProducts.length} Product(s)
      </Text>
      <View style={styles.filterButtons}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Icon name="filter-variant" size={20} color="#000" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Icon name="magnify" size={20} color="#666" />
              <TextInput
                style={styles.input}
                placeholder="Search products...."
                value={searchInput}
                onChangeText={searchProducts}
                returnKeyType="done"
              />
              {searchInput ? (
                <TouchableOpacity onPress={() => searchProducts("")}>
                  <Icon name="close" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
            <Icon name="cart-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {renderHeader()}

        <FlatList
          data={displayedProducts}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          keyboardShouldPersistTaps="handled"
        />

        <FilterModal
          visible={isFilterModalVisible}
          onClose={() => setIsFilterModalVisible(false)}
          onApply={handleFilterApply}
        />
      </KeyboardAvoidingView>
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
    alignItems: "center",
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    color: "#000",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
  },
  filterButtons: {
    flexDirection: "row",
    gap: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#000",
  },
  productList: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    gap: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
});

export default HomeScreen;
