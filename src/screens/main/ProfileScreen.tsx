import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList, RootStackParamList } from "../../types/index";
import { getStoredValue, getUsers, storeValue } from "../../utils/storage";

type ProfileNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Card validation utility functions (same as CheckoutScreen)
const validateCardNumber = (number: string) => {
  // Remove all non-digit characters
  const cardNumber = number.replace(/\D/g, "");

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

  // Add handleCardNumberChange function
  const handleCardNumberChange = (text: string) => {
    // Format card number with spaces after every 4 digits
    const digitsOnly = text.replace(/\D/g, "");
    let formatted = "";

    for (let i = 0; i < digitsOnly.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += digitsOnly[i];
    }

    if (digitsOnly.length <= 16) {
      setCardNumber(formatted);
    }

    // Clear error when user starts typing
    if (cardErrors.cardNumber) {
      setCardErrors({ ...cardErrors, cardNumber: undefined });
    }
  };

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
    try {
      // Load saved address
      const address = await getStoredValue("savedAddress");
      setSavedAddress(address);

      // Load payment method status
      const hasPayment = await getStoredValue("hasPaymentMethod");
      setHasPaymentMethod(hasPayment === "true");
    } catch (error) {
      console.error("Error loading user data:", error);
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
          screen: "PersonalInfo",
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
      onPress: () => {
        rootNavigation.navigate("UserManagement");
      },
    });

    menuItems.push({
      icon: "package-variant",
      title: "Product Management",
      onPress: () => {
        rootNavigation.navigate("ProductManagement");
      },
    });
  }

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
                  {item.subtitle && (
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  )}
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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Shipping Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.addressInput}
                placeholder="Enter your shipping address"
                value={address}
                onChangeText={(text) => {
                  setAddress(text);
                  setAddressError(null);
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                onFocus={() => setFocusedInput("address")}
                onBlur={() => setFocusedInput(null)}
              />

              {addressError && (
                <Text style={styles.errorText}>{addressError}</Text>
              )}

              <Button
                title="Save Address"
                onPress={async () => {
                  if (!address.trim()) {
                    setAddressError("Address is required");
                    return;
                  }

                  try {
                    await storeValue("savedAddress", address);
                    setSavedAddress(address);
                    setShowAddressModal(false);
                  } catch (error) {
                    console.error("Error saving address:", error);
                    setAddressError("Failed to save address");
                  }
                }}
                style={styles.saveButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Method</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <TextInput
                style={styles.input}
                placeholder="Card Number"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19}
                onFocus={() => setFocusedInput("cardNumber")}
                onBlur={() => setFocusedInput(null)}
              />
              {cardErrors.cardNumber && (
                <Text style={styles.errorText}>{cardErrors.cardNumber}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
                value={cardHolderName}
                onChangeText={(text) => {
                  setCardHolderName(text);
                  if (cardErrors.cardHolderName) {
                    setCardErrors({ ...cardErrors, cardHolderName: undefined });
                  }
                }}
                onFocus={() => setFocusedInput("cardHolderName")}
                onBlur={() => setFocusedInput(null)}
              />
              {cardErrors.cardHolderName && (
                <Text style={styles.errorText}>
                  {cardErrors.cardHolderName}
                </Text>
              )}

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="MM"
                    value={expiryMonth}
                    onChangeText={(text) => {
                      const month = text.replace(/\D/g, "");
                      if (month.length <= 2) {
                        setExpiryMonth(month);
                        if (cardErrors.expiryMonth) {
                          setCardErrors({
                            ...cardErrors,
                            expiryMonth: undefined,
                          });
                        }
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFocusedInput("expiryMonth")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {cardErrors.expiryMonth && (
                    <Text style={styles.errorText}>
                      {cardErrors.expiryMonth}
                    </Text>
                  )}
                </View>

                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="YY"
                    value={expiryYear}
                    onChangeText={(text) => {
                      const year = text.replace(/\D/g, "");
                      if (year.length <= 2) {
                        setExpiryYear(year);
                        if (cardErrors.expiryYear) {
                          setCardErrors({
                            ...cardErrors,
                            expiryYear: undefined,
                          });
                        }
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFocusedInput("expiryYear")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {cardErrors.expiryYear && (
                    <Text style={styles.errorText}>
                      {cardErrors.expiryYear}
                    </Text>
                  )}
                </View>

                <View style={styles.halfInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="CVV"
                    value={cvv}
                    onChangeText={(text) => {
                      const cvvNum = text.replace(/\D/g, "");
                      if (cvvNum.length <= 3) {
                        setCvv(cvvNum);
                        if (cardErrors.cvv) {
                          setCardErrors({ ...cardErrors, cvv: undefined });
                        }
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                    onFocus={() => setFocusedInput("cvv")}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {cardErrors.cvv && (
                    <Text style={styles.errorText}>{cardErrors.cvv}</Text>
                  )}
                </View>
              </View>

              <Button
                title="Save Card"
                onPress={async () => {
                  // Validate card details
                  const errors: typeof cardErrors = {};

                  if (!cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
                    errors.cardNumber =
                      "Please enter a valid 16-digit card number";
                  }

                  if (!cardHolderName.trim()) {
                    errors.cardHolderName = "Please enter the cardholder name";
                  }

                  const month = parseInt(expiryMonth);
                  const year = parseInt(expiryYear);
                  const currentYear = new Date().getFullYear() % 100;
                  const currentMonth = new Date().getMonth() + 1;

                  if (!month || month < 1 || month > 12) {
                    errors.expiryMonth = "Invalid month";
                  }

                  if (
                    !year ||
                    year < currentYear ||
                    (year === currentYear && month < currentMonth)
                  ) {
                    errors.expiryYear = "Card has expired";
                  }

                  if (!cvv.match(/^\d{3}$/)) {
                    errors.cvv = "Please enter a valid 3-digit CVV";
                  }

                  if (Object.keys(errors).length > 0) {
                    setCardErrors(errors);
                    return;
                  }

                  try {
                    // In a real app, we would validate the card with a payment processor
                    // For this demo, we'll just save the status
                    await storeValue("hasPaymentMethod", "true");
                    setHasPaymentMethod(true);
                    setShowPaymentModal(false);
                  } catch (error) {
                    console.error("Error saving payment method:", error);
                    setCardErrors({
                      ...cardErrors,
                      cardNumber: "Failed to save payment method",
                    });
                  }
                }}
                style={styles.saveButton}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    fontWeight: "bold",
  },
  addressInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    marginTop: 24,
  },
});

export default ProfileScreen;
