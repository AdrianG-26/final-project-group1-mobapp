import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList, RootStackParamList } from "../../types/index";
import { getStoredValue, getUsers, makeUserAdmin, storeValue } from "../../utils/storage";
import Button from "../../components/Button";

type ProfileNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Card validation utility functions (same as CheckoutScreen)
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

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const { user, logout } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Address state
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState<string | null>(null);
  
  // Payment method state
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    cardHolderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
  }>({});
  
  // Keep track of which input is focused for scrolling
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Load user data on initial mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  // Also reload data whenever the screen comes into focus
  // This ensures we capture any changes made in the checkout screen
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadUserData();
      }
      return () => {}; // cleanup if needed
    }, [user])
  );
  
  // Scroll to the focused input when keyboard appears
  useEffect(() => {
    if (focusedInput && scrollViewRef.current) {
      // Small delay to ensure the keyboard is up and components have rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 200, animated: true });
      }, 300);
    }
  }, [focusedInput]);

  const loadUserData = async () => {
    if (user) {
      try {
        // Load address data
        const storedAddress = await getStoredValue(`user_${user.id}_address`);
        
        if (storedAddress) {
          setSavedAddress(storedAddress);
          setAddress(storedAddress);
        }
        
        // Load payment data
        const storedCardNumber = await getStoredValue(`user_${user.id}_cardNumber`);
        const storedCardHolder = await getStoredValue(`user_${user.id}_cardHolderName`);
        const storedExpiryMonth = await getStoredValue(`user_${user.id}_expiryMonth`);
        const storedExpiryYear = await getStoredValue(`user_${user.id}_expiryYear`);
        
        if (storedCardNumber && storedCardHolder && storedExpiryMonth && storedExpiryYear) {
          setHasPaymentMethod(true);
          setCardNumber(storedCardNumber);
          setCardHolderName(storedCardHolder);
          setExpiryMonth(storedExpiryMonth);
          setExpiryYear(storedExpiryYear);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  };

  const validateAddress = () => {
    if (!address.trim()) {
      setAddressError("Please enter your address");
      return false;
    }
    setAddressError(null);
    return true;
  };

  const saveAddress = async () => {
    if (!user) return;
    
    if (!validateAddress()) {
      return;
    }
    
    try {
      await storeValue(`user_${user.id}_address`, address);
      await storeValue(`user_${user.id}_hasPlacedOrder`, 'true'); // Mark as returning user
      
      setSavedAddress(address);
      setShowAddressModal(false);
      
      Alert.alert(
        "Success", 
        "Your shipping address has been saved"
      );
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Failed to save your address. Please try again.");
    }
  };

  const validatePaymentMethod = () => {
    const errors: {
      cardNumber?: string;
      cardHolderName?: string;
      expiryMonth?: string;
      expiryYear?: string;
      cvv?: string;
    } = {};
    let isValid = true;
    
    // Validate card number (16 digits)
    if (!cardNumber.trim()) {
      errors.cardNumber = "Card number is required";
      isValid = false;
    } else {
      const digitsOnly = cardNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 16) {
        errors.cardNumber = "Card number must be 16 digits";
        isValid = false;
      } else if (!validateCardNumber(digitsOnly)) {
        errors.cardNumber = "Invalid card number";
        isValid = false;
      }
    }
    
    // Validate cardholder name
    if (!cardHolderName.trim()) {
      errors.cardHolderName = "Cardholder name is required";
      isValid = false;
    }
    
    // Validate month (1-12)
    if (!expiryMonth.trim()) {
      errors.expiryMonth = "Required";
      isValid = false;
    } else {
      const monthNum = parseInt(expiryMonth, 10);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        errors.expiryMonth = "Month must be 1-12";
        isValid = false;
      }
    }
    
    // Validate year (current year or later)
    if (!expiryYear.trim()) {
      errors.expiryYear = "Required";
      isValid = false;
    } else if (expiryYear.length !== 4) {
      errors.expiryYear = "Year must be 4 digits";
      isValid = false;
    } else {
      const yearNum = parseInt(expiryYear, 10);
      const currentYear = new Date().getFullYear();
      const maxYear = currentYear + 20; // 20 years into the future
      
      if (yearNum < currentYear) {
        errors.expiryYear = "Year cannot be in the past";
        isValid = false;
      } else if (yearNum > maxYear) {
        errors.expiryYear = `Year cannot be later than ${maxYear}`;
        isValid = false;
      }
      
      // Validate expiry date is not in the past
      if (yearNum === currentYear && !errors.expiryMonth) {
        const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
        const monthNum = parseInt(expiryMonth, 10);
        if (monthNum < currentMonth) {
          errors.expiryMonth = "Month cannot be in the past";
          isValid = false;
        }
      }
    }
    
    // Validate CVV
    if (!cvv.trim()) {
      errors.cvv = "Required";
      isValid = false;
    } else if (cvv.length !== 3) {
      errors.cvv = "CVV must be 3 digits";
      isValid = false;
    }
    
    setCardErrors(errors);
    return isValid;
  };

  const savePaymentMethod = async () => {
    if (!user) return;
    
    if (!validatePaymentMethod()) {
      return;
    }
    
    try {
      // Store card details (consider encrypting in a real app)
      await storeValue(`user_${user.id}_cardNumber`, cardNumber);
      await storeValue(`user_${user.id}_cardHolderName`, cardHolderName);
      await storeValue(`user_${user.id}_expiryMonth`, expiryMonth);
      await storeValue(`user_${user.id}_expiryYear`, expiryYear);
      // Don't store CVV for security reasons
      
      setHasPaymentMethod(true);
      setShowPaymentModal(false);
      
      Alert.alert(
        "Success", 
        "Your payment method has been saved"
      );
    } catch (error) {
      console.error("Error saving payment method:", error);
      Alert.alert("Error", "Failed to save your payment method. Please try again.");
    }
  };

  const clearPaymentMethod = async () => {
    if (!user) return;
    
    // Ask for confirmation before clearing payment information
    Alert.alert(
      "Clear Payment Method",
      "Are you sure you want to remove your saved payment method?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove all payment related data
              await Promise.all([
                storeValue(`user_${user.id}_cardNumber`, ''),
                storeValue(`user_${user.id}_cardHolderName`, ''),
                storeValue(`user_${user.id}_expiryMonth`, ''),
                storeValue(`user_${user.id}_expiryYear`, ''),
              ]);
              
              // Reset state
              setCardNumber('');
              setCardHolderName('');
              setExpiryMonth('');
              setExpiryYear('');
              setCvv('');
              setHasPaymentMethod(false);
              setCardErrors({});
              
              // Close the modal
              setShowPaymentModal(false);
              
              // Show success message
              Alert.alert(
                "Success",
                "Your payment method has been removed"
              );
            } catch (error) {
              console.error("Error clearing payment method:", error);
              Alert.alert("Error", "Failed to remove your payment method. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleCardNumberChange = (text: string) => {
    // Format card number with spaces after every 4 digits
    const digitsOnly = text.replace(/\D/g, '');
    let formatted = '';
    
    for (let i = 0; i < digitsOnly.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += digitsOnly[i];
    }
    
    if (digitsOnly.length <= 16) {
      setCardNumber(formatted);
    }
    
    // Clear error when user starts typing
    if (cardErrors.cardNumber) {
      setCardErrors({...cardErrors, cardNumber: undefined});
    }
  };

  const viewAllUsers = async () => {
    try {
      const allUsers = await getUsers();
      console.log("All Users:", JSON.stringify(allUsers, null, 2));
      Alert.alert(
        "Users Retrieved",
        `Found ${allUsers.length} users. Check the console log.`
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "Failed to retrieve users");
    }
  };

  const makeAdmin = async () => {
    try {
      const email = "adrian_louise_galvez@dlsl.edu.ph";
      const success = await makeUserAdmin(email);

      if (success) {
        Alert.alert(
          "Success",
          `User ${email} is now an admin. Please log out and log back in to see the changes.`
        );
      } else {
        Alert.alert("Error", `User ${email} not found.`);
      }
    } catch (error) {
      console.error("Error making user admin:", error);
      Alert.alert("Error", "Failed to make user an admin");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
            // Reset navigation stack to login screen
            rootNavigation.reset({
              index: 0,
              routes: [{ name: "Auth" }],
            });
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    {
      icon: "account-outline",
      title: "Personal Information",
      onPress: () => {
        navigation.navigate("ProfileTab", {
          screen: "PersonalInfo"
        });
      },
    },
    {
      icon: "package-variant",
      title: "Order History",
      onPress: () => {
        navigation.navigate("OrderHistory");
      },
    },
    {
      icon: "map-marker-outline",
      title: "Shipping Addresses",
      onPress: () => {
        setShowAddressModal(true);
      },
      subtitle: savedAddress ? "Tap to edit saved address" : "No address saved",
    },
    {
      icon: "credit-card-outline",
      title: "Card Payment",
      onPress: () => {
        setShowPaymentModal(true);
      },
      subtitle: hasPaymentMethod ? "Card saved" : "Add payment method",
    },
  ];

  // Add admin-only menu items
  if (user?.isAdmin) {
    menuItems.push({
      icon: "account-group",
      title: "View All Users",
      onPress: viewAllUsers,
    });

    menuItems.push({
      icon: "account-cog",
      title: "User Management",
      onPress: () => {
        rootNavigation.navigate("UserManagement");
      },
    });
  }

  // Temporary menu item for making a user admin
  menuItems.push({
    icon: "shield-account",
    title: "Make User Admin",
    onPress: makeAdmin,
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Icon name="account-circle" size={80} color="#000" />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Icon name={item.icon} size={24} color="#000" />
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  {item.subtitle && <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>}
                </View>
              </View>
              <Icon name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Address Modal */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Shipping Address</Text>
                <TouchableOpacity 
                  onPress={() => setShowAddressModal(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formScrollContainer}>
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.textArea,
                      addressError ? styles.inputError : {}
                    ]}
                    value={address}
                    onChangeText={(text) => {
                      setAddress(text);
                      if (addressError) setAddressError(null);
                    }}
                    placeholder="Enter your full address"
                    multiline
                  />
                  {addressError && <Text style={styles.errorText}>{addressError}</Text>}
                  
                  <Button
                    title="Save Address"
                    onPress={saveAddress}
                    style={styles.saveButton}
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Method</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowPaymentModal(false);
                    setFocusedInput(null);
                    Keyboard.dismiss();
                  }}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              <ScrollView
                ref={scrollViewRef}
                style={styles.formScrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formContainer}>
                  <View style={styles.paymentSecurityInfo}>
                    <Icon name="shield-check" size={20} color="#4CAF50" />
                    <Text style={styles.paymentSecurityText}>
                      Your payment details are stored securely for checkout convenience.
                    </Text>
                  </View>
                  
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={[
                    styles.cardInputContainer,
                    cardErrors.cardNumber ? styles.inputError : {}
                  ]}>
                    <Icon name="credit-card-outline" size={22} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.cardInput}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      keyboardType="number-pad"
                      maxLength={19} // 16 digits + 3 spaces
                      onFocus={() => setFocusedInput('cardNumber')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                  {cardErrors.cardNumber && <Text style={styles.errorText}>{cardErrors.cardNumber}</Text>}
                  
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <View style={[
                    styles.cardInputContainer,
                    cardErrors.cardHolderName ? styles.inputError : {}
                  ]}>
                    <Icon name="account-outline" size={22} color="#666" style={styles.inputIcon} />
                    <TextInput
                      style={styles.cardInput}
                      value={cardHolderName}
                      onChangeText={(text) => {
                        setCardHolderName(text);
                        if (cardErrors.cardHolderName) setCardErrors({...cardErrors, cardHolderName: undefined});
                      }}
                      placeholder="Full name on card"
                      onFocus={() => setFocusedInput('cardHolderName')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                  {cardErrors.cardHolderName && <Text style={styles.errorText}>{cardErrors.cardHolderName}</Text>}
                  
                  <View style={styles.expiryContainer}>
                    <View style={styles.expiryField}>
                      <Text style={styles.inputLabel}>Month (MM)</Text>
                      <View style={[
                        styles.cardInputContainer,
                        cardErrors.expiryMonth ? styles.inputError : {}
                      ]}>
                        <Icon name="calendar-month" size={22} color="#666" style={styles.inputIcon} />
                        <TextInput
                          style={styles.cardInput}
                          value={expiryMonth}
                          onChangeText={(text) => {
                            setExpiryMonth(text.replace(/\D/g, '').substring(0, 2));
                            if (cardErrors.expiryMonth) setCardErrors({...cardErrors, expiryMonth: undefined});
                          }}
                          placeholder="MM"
                          keyboardType="number-pad"
                          maxLength={2}
                          onFocus={() => setFocusedInput('expiryMonth')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                      {cardErrors.expiryMonth && <Text style={styles.errorText}>{cardErrors.expiryMonth}</Text>}
                    </View>
                    
                    <View style={styles.expiryField}>
                      <Text style={styles.inputLabel}>Year (YYYY)</Text>
                      <View style={[
                        styles.cardInputContainer,
                        cardErrors.expiryYear ? styles.inputError : {}
                      ]}>
                        <Icon name="calendar" size={22} color="#666" style={styles.inputIcon} />
                        <TextInput
                          style={styles.cardInput}
                          value={expiryYear}
                          onChangeText={(text) => {
                            setExpiryYear(text.replace(/\D/g, '').substring(0, 4));
                            if (cardErrors.expiryYear) setCardErrors({...cardErrors, expiryYear: undefined});
                          }}
                          placeholder="YYYY"
                          keyboardType="number-pad"
                          maxLength={4}
                          onFocus={() => setFocusedInput('expiryYear')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                      {cardErrors.expiryYear && <Text style={styles.errorText}>{cardErrors.expiryYear}</Text>}
                    </View>
                    
                    <View style={[styles.expiryField, { width: '30%' }]}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <View style={[
                        styles.cardInputContainer,
                        cardErrors.cvv ? styles.inputError : {}
                      ]}>
                        <Icon name="lock-outline" size={22} color="#666" style={styles.inputIcon} />
                        <TextInput
                          style={styles.cardInput}
                          value={cvv}
                          onChangeText={(text) => {
                            setCvv(text.replace(/\D/g, '').substring(0, 3));
                            if (cardErrors.cvv) setCardErrors({...cardErrors, cvv: undefined});
                          }}
                          placeholder="123"
                          keyboardType="number-pad"
                          maxLength={3}
                          secureTextEntry
                          onFocus={() => setFocusedInput('cvv')}
                          onBlur={() => setFocusedInput(null)}
                        />
                      </View>
                      {cardErrors.cvv && <Text style={styles.errorText}>{cardErrors.cvv}</Text>}
                    </View>
                  </View>
                  
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Save Payment Method"
                      onPress={savePaymentMethod}
                      style={hasPaymentMethod ? styles.primaryButton : styles.saveButton}
                    />
                    
                    {hasPaymentMethod && (
                      <Button
                        title="Clear Payment Method"
                        onPress={clearPaymentMethod}
                        style={styles.clearButton}
                      />
                    )}
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatarContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  menuContainer: {
    backgroundColor: "#fff",
    marginTop: 20,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuTextContainer: {
    marginLeft: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#000",
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  logoutText: {
    fontSize: 16,
    color: "#FF3B30",
    marginLeft: 8,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  closeButton: {
    padding: 4,
  },
  formScrollContainer: {
    maxHeight: 500,
  },
  formContainer: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#000",
  },
  primaryButton: {
    backgroundColor: "#000",
  },
  clearButton: {
    backgroundColor: "#FF3B30",
  },
  buttonContainer: {
    marginTop: 24,
    flexDirection: "column",
    gap: 12,
  },
  cardInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  inputIcon: {
    marginLeft: 12,
  },
  cardInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  expiryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  expiryField: {
    width: "32%",
  },
  paymentSecurityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentSecurityText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProfileScreen;
