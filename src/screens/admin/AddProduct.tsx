import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { Product } from '../../types/index';
import { saveProduct } from '../../utils/storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';

type AddProductNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const AddProduct = () => {
  const navigation = useNavigation<AddProductNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    sizes: [],
    stock: {},
    rating: 0,
    ratingCount: 0,
    brand: '',
    gender: "Unisex",
  });

  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sizeError, setSizeError] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to use the camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const validateSize = (newSize: string) => {
    if (formData.sizes?.includes(newSize)) {
      setSizeError('This size already exists in the inventory');
      return false;
    }
    setSizeError('');
    return true;
  };

  const handleSizeChange = (text: string) => {
    setSize(text);
    if (text) validateSize(text);
    else setSizeError('');
  };

  const handleAddSize = () => {
    if (size && quantity) {
      if (!validateSize(size)) return;

      setFormData((prev: Partial<Product>) => ({
        ...prev,
        sizes: [...(prev.sizes || []), size],
        stock: { ...(prev.stock || {}), [size]: parseInt(quantity) }
      }));
      setSize('');
      setQuantity('');
      setSizeError('');
    }
  };

  const adjustQuantity = (sizeKey: string, amount: number) => {
    const currentStock = formData.stock?.[sizeKey] || 0;
    const newQuantity = Math.max(0, currentStock + amount);
    
    setFormData((prev: Partial<Product>) => ({
      ...prev,
      stock: { ...(prev.stock || {}), [sizeKey]: newQuantity }
    }));
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    setFormData((prev: Partial<Product>) => {
      const newSizes = prev.sizes?.filter((s: string) => s !== sizeToRemove) || [];
      const newStock = { ...prev.stock };
      delete newStock[sizeToRemove];
      return {
        ...prev,
        sizes: newSizes,
        stock: newStock
      };
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.price || !formData.description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const newProduct: Product = {
        ...formData as Product,
        id: uuidv4(),
      };

      await saveProduct(newProduct);
      Alert.alert('Success', 'Product added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const handleFocus = (y: number) => {
    scrollViewRef.current?.scrollTo({ y: y, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView ref={scrollViewRef}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Product</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.form}>
            <View style={styles.photoSection}>
              <View style={styles.imageContainer}>
                {formData.image ? (
                  <Image 
                    source={{ uri: formData.image as string }} 
                    style={styles.productImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.placeholderContainer, styles.productImage]}>
                    <Icon name="camera" size={40} color="#666" />
                    <Text style={styles.placeholderText}>Add Photo</Text>
                  </View>
                )}
              </View>
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Icon name="image" size={24} color="#000" />
                  <Text style={styles.photoButtonText}>Upload Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Icon name="camera" size={24} color="#000" />
                  <Text style={styles.photoButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Product name"
                onFocus={() => handleFocus(0)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Product description"
                multiline
                numberOfLines={4}
                onFocus={() => handleFocus(100)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.price?.toString()}
                onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
                placeholder="0.00"
                keyboardType="numeric"
                onFocus={() => handleFocus(250)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholder="Brand name"
                onFocus={() => handleFocus(350)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="Product category"
                onFocus={() => handleFocus(450)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {["Men's", "Women's", "Unisex"].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      formData.gender === gender && styles.genderButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, gender: gender as Product['gender'] })}
                  >
                    <Text style={[
                      styles.genderButtonText,
                      formData.gender === gender && styles.genderButtonTextActive,
                    ]}>
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Size and Stock</Text>
              <View style={styles.sizeStockContainer}>
                <TextInput
                  style={[styles.input, styles.sizeInput]}
                  value={size}
                  onChangeText={handleSizeChange}
                  placeholder="Size"
                  onFocus={() => handleFocus(700)}
                />
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Quantity"
                  keyboardType="numeric"
                  onFocus={() => handleFocus(700)}
                />
                <TouchableOpacity 
                  style={[
                    styles.addButton,
                    (!size || !quantity || sizeError) && styles.addButtonDisabled
                  ]} 
                  onPress={handleAddSize}
                  disabled={!size || !quantity || !!sizeError}
                >
                  <Icon name="plus" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              {sizeError ? (
                <Text style={styles.errorText}>{sizeError}</Text>
              ) : null}
              <View style={styles.sizeList}>
                {formData.sizes?.map((s: string) => (
                  <View key={s} style={styles.sizeItem}>
                    <View style={styles.sizeInfo}>
                      <Text style={styles.sizeText}>{s}</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => adjustQuantity(s, -1)}
                        >
                          <Icon name="minus" size={16} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{formData.stock?.[s]} pcs</Text>
                        <TouchableOpacity 
                          style={styles.quantityButton}
                          onPress={() => adjustQuantity(s, 1)}
                        >
                          <Icon name="plus" size={16} color="#000" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveSize(s)}
                      style={styles.removeButton}
                    >
                      <Icon name="delete" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  genderButtonText: {
    color: '#000',
    fontSize: 16,
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  sizeStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeInput: {
    flex: 2,
    marginRight: 8,
  },
  quantityInput: {
    flex: 2,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeList: {
    marginTop: 8,
  },
  sizeItem: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 8,
    maxWidth: 160,
  },
  photoButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  sizeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    padding: 4,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    minWidth: 50,
    textAlign: 'center',
  },
});

export default AddProduct;
