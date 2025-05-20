import { useNavigation } from "@react-navigation/native";import { NativeStackNavigationProp } from "@react-navigation/native-stack";import React, { useEffect, useState, useMemo } from "react";import {  ActivityIndicator,  Image,  KeyboardAvoidingView,  Platform,  ScrollView,  StyleSheet,  Text,  TouchableOpacity,  View,} from "react-native";import { v4 as uuidv4 } from "uuid";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { MainStackParamList, Order, Product } from "../../types/index";
import { getProducts, saveOrder, getStoredValue, storeValue } from "../../utils/storage";
import { validateEmail } from "../../utils/validation";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList
>;

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart, checkedItems, getCheckedItemsTotal, removeCheckedItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Delivery, 2: Payment
  const [addressDetailsExpanded, setAddressDetailsExpanded] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  
  // Create scrollView ref for scrolling to errors
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Calculate delivery dates
  const deliveryDates = useMemo(() => {
    const now = new Date();
    
    // Click & Collect: 1 day after current date
    const clickCollectDate = new Date(now);
    clickCollectDate.setDate(now.getDate() + 1);
    
    // Home Delivery: 7 days after current date
    const homeDeliveryDate = new Date(now);
    homeDeliveryDate.setDate(now.getDate() + 7);
    
    // Format the dates
    const formatDate = (date: Date) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      
      return `${dayName}, ${day} ${month}`;
    };
    
    return {
      clickCollect: formatDate(clickCollectDate),
      homeDelivery: formatDate(homeDeliveryDate)
    };
  }, []);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [useDeliveryAsBilling, setUseDeliveryAsBilling] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState("click-collect"); // click-collect or home-delivery

  // Add new state variables for payment methods
  const [paymentMethod, setPaymentMethod] = useState("cash-on-delivery"); // cash-on-delivery or credit-card
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [paymentDetailsExpanded, setPaymentDetailsExpanded] = useState(false);

  // Error state
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    cardNumber?: string;
    cardHolderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
  }>({});

  // Clear specific error when user types
  const clearError = (field: string) => {
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate phone number - must be exactly 11 digits
  const validatePhoneNumber = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 11;
  };

  // Handle phone number change with validation
  const handlePhoneChange = (value: string) => {
    // Only allow digits but don't trim length
    const digitsOnly = value.replace(/\D/g, '');
    setPhone(digitsOnly);
    
    // Show validation message based on length
    if (digitsOnly.length > 11) {
      setErrors(prev => ({ 
        ...prev, 
        phone: "Phone number must be exactly 11 digits" 
      }));
    } else if (digitsOnly.length === 11) {
      // Clear error when exactly 11 digits
      clearError('phone');
    } else if (digitsOnly.length > 0) {
      // Show error when less than 11 digits but only if user has started typing
      setErrors(prev => ({ 
        ...prev, 
        phone: "Phone number must be exactly 11 digits" 
      }));
    }
  };

  // Validate card number using Luhn algorithm
  const validateCardNumber = (number: string) => {
    // Remove all non-digit characters
    const cardNumber = number.replace(/\D/g, '');
    
    // Check if the length is 16 digits
    if (cardNumber.length !== 16) {
      return false;
    }
    
    // Luhn algorithm (credit card validation)
    let sum = 0;
    let shouldDouble = false;
    
    // Loop through digits in reverse
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };
  
  // Handle card number input with formatting
  const handleCardNumberChange = (text: string) => {
    // Remove all non-digit characters
    const cardNumber = text.replace(/\D/g, '');
    
    // Format with spaces every 4 digits
    let formattedNumber = '';
    for (let i = 0; i < cardNumber.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedNumber += ' ';
      }
      formattedNumber += cardNumber.charAt(i);
    }
    
    // Limit to 16 digits (19 chars with spaces)
    if (cardNumber.length <= 16) {
      setCardNumber(formattedNumber);
    }
    
    // Validate and set error
    if (cardNumber.length > 0) {
      if (cardNumber.length !== 16) {
        setErrors(prev => ({...prev, cardNumber: "Card number must be 16 digits"}));
      } else if (!validateCardNumber(cardNumber)) {
        setErrors(prev => ({...prev, cardNumber: "Invalid card number"}));
      } else {
        clearError('cardNumber');
      }
    } else {
      clearError('cardNumber');
    }
  };
  
  // Handle expiry month input with validation
  const handleExpiryMonthChange = (text: string) => {
    // Remove all non-digit characters
    const month = text.replace(/\D/g, '');
    
    if (month.length <= 2) {
      setExpiryMonth(month);
    }
    
    // Validate month (1-12)
    if (month.length > 0) {
      const monthNum = parseInt(month, 10);
      if (monthNum < 1 || monthNum > 12) {
        setErrors(prev => ({...prev, expiryMonth: "Month must be 1-12"}));
      } else {
        clearError('expiryMonth');
      }
    } else {
      clearError('expiryMonth');
    }
  };
  
  // Handle expiry year input with validation
  const handleExpiryYearChange = (text: string) => {
    // Remove all non-digit characters
    const year = text.replace(/\D/g, '');
    
    if (year.length <= 4) {
      setExpiryYear(year);
    }
    
    // Validate year (current or future years)
    if (year.length === 4) {
      const currentYear = new Date().getFullYear();
      const yearNum = parseInt(year, 10);
      
      if (yearNum < currentYear) {
        setErrors(prev => ({...prev, expiryYear: "Year cannot be in the past"}));
      } else {
        clearError('expiryYear');
      }
    } else if (year.length > 0) {
      setErrors(prev => ({...prev, expiryYear: "Year must be 4 digits"}));
    } else {
      clearError('expiryYear');
    }
  };
  
  // Handle CVV input with validation
  const handleCvvChange = (text: string) => {
    // Remove all non-digit characters
    const cvvText = text.replace(/\D/g, '');
    
    if (cvvText.length <= 3) {
      setCvv(cvvText);
    }
    
    // Validate CVV (3 digits)
    if (cvvText.length > 0 && cvvText.length !== 3) {
      setErrors(prev => ({...prev, cvv: "CVV must be 3 digits"}));
    } else {
      clearError('cvv');
    }
  };

  useEffect(() => {
    loadProducts();
    checkIfFirstTimeUser();
    if (user) {
      setFullName(user.name);
      setEmail(user.email);
    }
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

  const checkIfFirstTimeUser = async () => {
    try {
      if (user) {
        // Check if user has placed an order before
        const savedUserData = await getStoredValue(`user_${user.id}_hasPlacedOrder`);
        const isFirst = savedUserData !== 'true';
        setIsFirstTimeUser(isFirst);
        
        // If not first time, get their saved info
        if (!isFirst) {
          const savedPhone = await getStoredValue(`user_${user.id}_phone`);
          const savedAddress = await getStoredValue(`user_${user.id}_address`);
          if (savedPhone) setPhone(savedPhone);
          if (savedAddress) setAddress(savedAddress);
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
    }
  };

  const validateForm = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      phone?: string;
      cardNumber?: string;
      cardHolderName?: string;
      expiryMonth?: string;
      expiryYear?: string;
      cvv?: string;
    } = {};

    if (!fullName) newErrors.fullName = "Full name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
    
    // Only validate address and phone for first-time users
    if (isFirstTimeUser) {
      if (!address) newErrors.address = "Address is required";
      if (!phone) newErrors.phone = "Phone number is required";
      else if (phone.length !== 11) newErrors.phone = "Phone number must be exactly 11 digits";
    }

    // Validate credit card details if credit card is selected as payment method
    if (paymentMethod === "credit-card") {
      // Validate card number
      if (!cardNumber) {
        newErrors.cardNumber = "Card number is required";
      } else {
        const digitsOnly = cardNumber.replace(/\D/g, '');
        if (digitsOnly.length !== 16) {
          newErrors.cardNumber = "Card number must be 16 digits";
        } else if (!validateCardNumber(digitsOnly)) {
          newErrors.cardNumber = "Invalid card number";
        }
      }
      
      // Validate card holder name
      if (!cardHolderName) {
        newErrors.cardHolderName = "Cardholder name is required";
      }
      
      // Validate expiry month
      if (!expiryMonth) {
        newErrors.expiryMonth = "Expiry month is required";
      } else {
        const monthNum = parseInt(expiryMonth, 10);
        if (monthNum < 1 || monthNum > 12) {
          newErrors.expiryMonth = "Month must be 1-12";
        }
      }
      
      // Validate expiry year
      if (!expiryYear) {
        newErrors.expiryYear = "Expiry year is required";
      } else if (expiryYear.length !== 4) {
        newErrors.expiryYear = "Year must be 4 digits";
      } else {
        const yearNum = parseInt(expiryYear, 10);
        const currentYear = new Date().getFullYear();
        if (yearNum < currentYear) {
          newErrors.expiryYear = "Year cannot be in the past";
        }
        
        // Check if card is expired
        if (parseInt(expiryYear, 10) === currentYear) {
          const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-based
          if (parseInt(expiryMonth, 10) < currentMonth) {
            newErrors.expiryMonth = "Card has expired";
          }
        }
      }
      
      // Validate CVV
      if (!cvv) {
        newErrors.cvv = "CVV is required";
      } else if (cvv.length !== 3) {
        newErrors.cvv = "CVV must be 3 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      // If address or phone are missing, expand the address details
      if (isFirstTimeUser && (!address || !phone)) {
        setAddressDetailsExpanded(true);
        
        // Allow time for the expansion to happen before scrolling
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: 0,
            animated: true
          });
        }, 100);
      }
      return;
    }

    setProcessing(true);
    try {
      const orderId = uuidv4();
      const order: Order = {
        id: orderId,
        userId: user?.id || "",
        items: checkedItems,
        total: getTotalAmount(),
        status: "pending",
        createdAt: new Date().toISOString(),
        shippingAddress: {
          fullName,
          email,
          address,
          city,
          state,
          zipCode,
          phone,
        },
        deliveryMethod,
        paymentMethod,
        paymentDetails: {
          cardNumber,
          cardHolderName,
          expiryMonth,
          expiryYear,
          cvv,
        },
      };

      await saveOrder(order);
      
      // Save user data after first order
      if (isFirstTimeUser && user) {
        await storeValue(`user_${user.id}_hasPlacedOrder`, 'true');
        await storeValue(`user_${user.id}_phone`, phone);
        await storeValue(`user_${user.id}_address`, address);
      }
      
      // Only remove the items that were checked out
      await removeCheckedItems();
      
      // Show success toast notification
      Toast.show({
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: deliveryMethod === 'click-collect' 
          ? `Pick up available on ${deliveryDates.clickCollect}`
          : `Delivery expected by ${deliveryDates.homeDelivery}`,
        visibilityTime: 4000,
        topOffset: 50
      });
      
      // Navigate to home screen after successful order placement
      navigation.navigate("HomeScreen");
      
    } catch (error) {
      console.error("Checkout error:", error);
      setErrors({
        email: "An error occurred. Please try again.",
      });
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: 'There was an error processing your order. Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to calculate total amount
  const getTotalAmount = () => {
    return getCheckedItemsTotal(products) + (deliveryMethod === "home-delivery" ? 150 : 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const totalAmount = getCheckedItemsTotal(products);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 1 ? "Delivery" : "Payment"}
        </Text>
        <View style={styles.placeholderView}></View>
      </View>

      <KeyboardAvoidingView
        style={styles.contentContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView 
          style={styles.scrollView}
          ref={scrollViewRef}
        >
          {currentStep === 1 ? (
            <>
              <View style={styles.addressContainer}>
                <TouchableOpacity 
                  style={styles.addressHeader}
                  onPress={() => setAddressDetailsExpanded(!addressDetailsExpanded)}
                >
                  <Text style={styles.addressLabel}>Delivery Info</Text>
                  <Icon 
                    name={addressDetailsExpanded ? "chevron-down" : "chevron-right"} 
                    size={24} 
                    color="#000" 
                  />
                </TouchableOpacity>
                
                {!addressDetailsExpanded && (
                  <TouchableOpacity
                    style={styles.addressSummary}
                    onPress={() => setAddressDetailsExpanded(true)}
                  >
                    <Text style={styles.addressName}>{fullName || "Enter your name"}</Text>
                    <Text style={styles.addressDetail}>
                      {address || (isFirstTimeUser ? "Enter your address" : "Click to expand")}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {addressDetailsExpanded && (
                  <View style={styles.addressContent}>
                    <Input
                      label="Full Name"
                      value={fullName}
                      onChangeText={setFullName}
                      error={errors.fullName}
                      containerStyle={{...styles.inputContainer}}
                    />
                    <Input
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email}
                      containerStyle={{...styles.inputContainer}}
                      editable={false}
                      inputStyle={styles.nonEditableInput}
                    />
                    <Input
                      label={`Phone Number${isFirstTimeUser ? '' : ' (Optional)'}`}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      error={errors.phone}
                      containerStyle={{...styles.inputContainer}}
                    />
                    <Input
                      label={`Address${isFirstTimeUser ? '' : ' (Optional)'}`}
                      value={address}
                      onChangeText={(value) => {
                        setAddress(value);
                        clearError('address');
                      }}
                      error={errors.address}
                      containerStyle={{...styles.inputContainer}}
                    />
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {checkedItems.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  return (
                    <View key={`${item.productId}-${item.size}`} style={styles.parcelItem}>
                      <Image 
                        source={typeof product.image === 'string' ? { uri: product.image } : product.image} 
                        style={styles.productImage}
                      />
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productDetails}>Size {item.size}</Text>
                        <Text style={styles.productDetails}>Quantity {item.quantity}</Text>
                        <Text style={styles.productPrice}>₱{product.price.toLocaleString()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.section}>
                <Text style={styles.deliveryMethodTitle}>Please select your delivery method</Text>
                
                {/* Click & Collect Option */}
                <View style={styles.deliveryTypeContainer}>
                  <View style={styles.deliveryTypeHeader}>
                    <Icon name="store" size={22} color="#000" />
                    <Text style={styles.deliveryTypeTitle}>Click & Collect</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deliveryOption}
                    onPress={() => setDeliveryMethod("click-collect")}
                  >
                    <View style={styles.radioButton}>
                      {deliveryMethod === "click-collect" && <View style={styles.radioButtonInner} />}
                    </View>
                    <View style={styles.deliveryOptionContent}>
                      <Text style={styles.deliveryOptionText}>Collect it from {deliveryDates.clickCollect}</Text>
                      <Text style={styles.deliveryOptionSubtext}>Click & Collect</Text>
                    </View>
                    <Text style={styles.deliveryPrice}>Free</Text>
                  </TouchableOpacity>
                </View>

                {/* Home Delivery Option */}
                <View style={styles.deliveryTypeContainer}>
                  <View style={styles.deliveryTypeHeader}>
                    <Icon name="truck-delivery" size={22} color="#000" />
                    <Text style={styles.deliveryTypeTitle}>Home Delivery</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deliveryOption}
                    onPress={() => setDeliveryMethod("home-delivery")}
                  >
                    <View style={styles.radioButton}>
                      {deliveryMethod === "home-delivery" && <View style={styles.radioButtonInner} />}
                    </View>
                    <View style={styles.deliveryOptionContent}>
                      <Text style={styles.deliveryOptionText}>Arrives by {deliveryDates.homeDelivery}</Text>
                      <Text style={styles.deliveryOptionSubtext}>Standard Home Delivery</Text>
                    </View>
                    <Text style={styles.deliveryPrice}>₱150</Text>
                  </TouchableOpacity>
                </View>

                {/* Payment Methods Section */}
                <View style={styles.section}>
                  <Text style={styles.deliveryMethodTitle}>Please select your payment method</Text>
                  
                  {/* Cash on Delivery Option */}
                  <View style={styles.deliveryTypeContainer}>
                    <View style={styles.deliveryTypeHeader}>
                      <Icon name="cash" size={22} color="#000" />
                      <Text style={styles.deliveryTypeTitle}>Cash on Delivery</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deliveryOption}
                      onPress={() => {
                        setPaymentMethod("cash-on-delivery");
                        setPaymentDetailsExpanded(false);
                      }}
                    >
                      <View style={styles.radioButton}>
                        {paymentMethod === "cash-on-delivery" && <View style={styles.radioButtonInner} />}
                      </View>
                      <View style={styles.deliveryOptionContent}>
                        <Text style={styles.deliveryOptionText}>Pay when you receive</Text>
                        <Text style={styles.deliveryOptionSubtext}>No additional fees</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Credit Card Option */}
                  <View style={styles.deliveryTypeContainer}>
                    <View style={styles.deliveryTypeHeader}>
                      <Icon name="credit-card" size={22} color="#000" />
                      <Text style={styles.deliveryTypeTitle}>Credit Card</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.deliveryOption}
                      onPress={() => {
                        setPaymentMethod("credit-card");
                        setPaymentDetailsExpanded(true);
                      }}
                    >
                      <View style={styles.radioButton}>
                        {paymentMethod === "credit-card" && <View style={styles.radioButtonInner} />}
                      </View>
                      <View style={styles.deliveryOptionContent}>
                        <Text style={styles.deliveryOptionText}>Pay with credit card</Text>
                        <Text style={styles.deliveryOptionSubtext}>Secure online payment</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Credit Card Details */}
                    {paymentMethod === "credit-card" && paymentDetailsExpanded && (
                      <View style={styles.cardDetailsContainer}>
                        <Input
                          label="Card Number"
                          value={cardNumber}
                          onChangeText={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          keyboardType="numeric"
                          maxLength={19} // 16 digits + 3 spaces
                          error={errors.cardNumber}
                          containerStyle={styles.inputContainer}
                          leftIcon={<Icon name="credit-card-outline" size={22} color="#666" />}
                        />
                        
                        <Input
                          label="Cardholder Name"
                          value={cardHolderName}
                          onChangeText={(text) => {
                            setCardHolderName(text);
                            clearError('cardHolderName');
                          }}
                          placeholder="John Doe"
                          error={errors.cardHolderName}
                          containerStyle={styles.inputContainer}
                          leftIcon={<Icon name="account-outline" size={22} color="#666" />}
                        />
                        
                        <View style={styles.cardExpiryContainer}>
                          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Input
                              label="Month (MM)"
                              value={expiryMonth}
                              onChangeText={handleExpiryMonthChange}
                              placeholder="MM"
                              keyboardType="numeric"
                              maxLength={2}
                              error={errors.expiryMonth}
                              containerStyle={{ marginBottom: 0 }}
                              leftIcon={<Icon name="calendar-month" size={20} color="#666" />}
                            />
                          </View>
                          
                          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                            <Input
                              label="Year (YYYY)"
                              value={expiryYear}
                              onChangeText={handleExpiryYearChange}
                              placeholder="YYYY"
                              keyboardType="numeric"
                              maxLength={4}
                              error={errors.expiryYear}
                              containerStyle={{ marginBottom: 0 }}
                              leftIcon={<Icon name="calendar" size={20} color="#666" />}
                            />
                          </View>
                          
                          <View style={[styles.inputContainer, { flex: 0.8 }]}>
                            <Input
                              label="CVV"
                              value={cvv}
                              onChangeText={handleCvvChange}
                              placeholder="123"
                              keyboardType="numeric"
                              maxLength={3}
                              error={errors.cvv}
                              containerStyle={{ marginBottom: 0 }}
                              leftIcon={<Icon name="lock-outline" size={20} color="#666" />}
                            />
                          </View>
                        </View>
                        
                        <View style={styles.cardSecurityInfo}>
                          <Icon name="shield-check" size={20} color="#4CAF50" />
                          <Text style={styles.cardSecurityText}>
                            Your payment information is processed securely. We do not store your credit card details.
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Payment Summary at the bottom of delivery method */}
              <View style={styles.paymentSummaryContainer}>
                <Text style={styles.summaryTitle}>Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>₱{totalAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping Fees</Text>
                  <Text style={styles.summaryValue}>
                    {deliveryMethod === "home-delivery" ? "₱150" : "Free"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Method</Text>
                  <Text style={styles.summaryValue}>
                    {deliveryMethod === "home-delivery" ? "Home Delivery" : "Click & Collect"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payment Method</Text>
                  <Text style={styles.summaryValue}>
                    {paymentMethod === "credit-card" ? "Credit Card" : "Cash on Delivery"}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    ₱{getTotalAmount().toLocaleString()}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₱{totalAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Fees</Text>
                <Text style={styles.summaryValue}>
                  {deliveryMethod === "home-delivery" ? "₱150" : "Free"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Method</Text>
                <Text style={styles.summaryValue}>
                  {deliveryMethod === "home-delivery" ? "Home Delivery" : "Click & Collect"}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Method</Text>
                <Text style={styles.summaryValue}>
                  {paymentMethod === "credit-card" ? "Credit Card" : "Cash on Delivery"}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₱{getTotalAmount().toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>
            ₱{getTotalAmount().toLocaleString()}
          </Text>
        </View>
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={processing}
          disabled={processing}
          style={styles.actionButton}
        />
      </View>
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
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  backButton: {
    padding: 4,
  },
  placeholderView: {
    width: 24, // Same width as the back button icon for balance
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  addressContainer: {
    padding: 16,
    marginTop: 8,
    backgroundColor: "#fff",
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  addressContent: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  addressSummary: {
    marginTop: 8,
    marginBottom: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  nonEditableInput: {
    backgroundColor: "#f0f0f0",
    color: "#666",
  },
  deliveryNote: {
    fontSize: 14,
    color: "#666",
    marginTop: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#000",
    marginLeft: 8,
  },
  parcelItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 4,
  },
  deliveryMethodTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  deliveryTypeContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  deliveryTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  deliveryTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginLeft: 10,
  },
  deliveryOption: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  deliveryOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  deliveryOptionSubtext: {
    fontSize: 14,
    color: "#666",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#888",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
  },
  deliveryPrice: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  formFields: {
    marginTop: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#000",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  footerTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  footerTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  actionButton: {
    backgroundColor: "#000",
  },
  paymentSummaryContainer: {
    marginTop: 24,
    marginBottom: -10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  cardDetailsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  cardExpiryContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardSecurityInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  cardSecurityText: {
    flex: 1,
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
});

export default CheckoutScreen;
