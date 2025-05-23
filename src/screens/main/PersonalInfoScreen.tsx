import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Button from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { MainStackParamList } from "../../types";
import { User } from "../../types/index";
import { updateUser } from "../../utils/storage";

type PersonalInfoScreenProps = {
  navigation: NativeStackNavigationProp<MainStackParamList>;
};

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
}

interface FieldChanges {
  name?: boolean;
  email?: boolean;
  phone?: boolean;
  dob?: boolean;
}

const PersonalInfoScreen = ({ navigation }: PersonalInfoScreenProps) => {
  const { user, reloadUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
  });
  const [originalInfo, setOriginalInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    dob: user?.dob || "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [fieldChanges, setFieldChanges] = useState<FieldChanges>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const months = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];
  const days = Array.from({ length: 31 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const years = Array.from({ length: 100 }, (_, i) =>
    String(new Date().getFullYear() - i)
  );

  useEffect(() => {
    if (editedInfo.dob) {
      const [month, day, year] = editedInfo.dob.split("/");
      setSelectedMonth(month);
      setSelectedDay(day);
      setSelectedYear(year);
    }
  }, [editedInfo.dob]);

  useEffect(() => {
    // Check if any field has changed from original
    const changes: FieldChanges = {};
    let hasAnyChanges = false;

    Object.keys(editedInfo).forEach((key) => {
      const field = key as keyof typeof editedInfo;
      const hasChanged = editedInfo[field] !== originalInfo[field];
      changes[field] = hasChanged;
      if (hasChanged) hasAnyChanges = true;
    });

    setFieldChanges(changes);
    setHasChanges(hasAnyChanges);
  }, [editedInfo, originalInfo]);

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return undefined;
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        break;
      case "phone":
        const phoneRegex = /^\d{11}$/;
        if (!value) return undefined;
        if (!phoneRegex.test(value))
          return "Phone number must be exactly 11 digits";
        break;
      case "dob":
        if (!value) return undefined;
        if (!selectedMonth || !selectedDay || !selectedYear)
          return "Please select a complete date";
        break;
      case "name":
        if (!value) return undefined;
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 30) return "Name must not exceed 30 characters";
        break;
    }
    return undefined;
  };

  const isSaveDisabled = () => {
    if (!editedInfo.name || !editedInfo.phone) return true;
    return (
      editedInfo.name.length < 2 ||
      editedInfo.name.length > 30 ||
      editedInfo.phone.length !== 11
    );
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setOriginalInfo({ ...editedInfo });
    setFieldChanges({});
  };

  const handleCancel = () => {
    setEditedInfo({ ...originalInfo });
    setValidationErrors({});
    setFieldChanges({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    // Validate all fields
    const errors: ValidationErrors = {};
    Object.keys(editedInfo).forEach((field) => {
      const error = validateField(
        field,
        editedInfo[field as keyof typeof editedInfo]
      );
      if (error) errors[field as keyof ValidationErrors] = error;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      if (!user) {
        Alert.alert("Error", "User not found");
        return;
      }

      // Create updated user object with all required fields
      const updatedUser: User = {
        id: user.id,
        name: editedInfo.name,
        email: user.email,
        password: user.password,
        phone: editedInfo.phone || undefined,
        dob: editedInfo.dob || undefined,
        isAdmin: user.isAdmin,
      };

      // Save changes
      const success = await updateUser(updatedUser);

      if (success) {
        await reloadUser();
        setEditedInfo({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          dob: user?.dob || "",
        });
        setOriginalInfo({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          dob: user?.dob || "",
        });
        setValidationErrors({});
        setFieldChanges({});
        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "An error occurred while saving your profile");
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Limit phone number to 11 digits
    if (field === "phone" && value.length > 11) {
      return;
    }

    setEditedInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate field in real-time
    const error = validateField(field, value);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleDateSelect = () => {
    if (selectedMonth && selectedDay && selectedYear) {
      const newDate = `${selectedMonth}/${selectedDay}/${selectedYear}`;
      handleFieldChange("dob", newDate);
      setShowDatePicker(false);
    }
  };

  const renderDatePicker = () => (
    <Modal visible={showDatePicker} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerContainer}>
          <View style={styles.datePickerHeader}>
            <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Icon name="close" size={24} color="#222" />
            </TouchableOpacity>
          </View>
          <View style={styles.datePickerContent}>
            <ScrollView style={styles.datePickerColumn}>
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.datePickerItem,
                    selectedMonth === month && styles.datePickerItemSelected,
                  ]}
                  onPress={() => setSelectedMonth(month)}
                >
                  <Text
                    style={[
                      styles.datePickerItemText,
                      selectedMonth === month &&
                        styles.datePickerItemTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.datePickerColumn}>
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.datePickerItem,
                    selectedDay === day && styles.datePickerItemSelected,
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.datePickerItemText,
                      selectedDay === day && styles.datePickerItemTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView style={styles.datePickerColumn}>
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.datePickerItem,
                    selectedYear === year && styles.datePickerItemSelected,
                  ]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text
                    style={[
                      styles.datePickerItemText,
                      selectedYear === year &&
                        styles.datePickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.datePickerFooter}>
            <Button
              title="Confirm"
              onPress={handleDateSelect}
              variant="primary"
              size="medium"
              style={styles.confirmButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.avatarWrapper}>
              {profileImage ? (
                <TouchableOpacity onPress={() => setShowImagePreview(true)}>
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ) : (
                <Icon name="account-circle" size={90} color="#222" />
              )}
              {profileImage && (
                <TouchableOpacity
                  style={styles.avatarEditBtn}
                  onPress={() => setShowImagePreview(true)}
                >
                  <Icon name="magnify" size={22} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.name}>{editedInfo.name || "Full Name"}</Text>
            <View style={styles.actionRow}>
              <Button
                title="Upload Photo"
                onPress={pickImage}
                variant="primary"
                size="medium"
                style={styles.uploadBtn}
              />
              <Button
                title="Edit Profile"
                onPress={handleEditProfile}
                variant="primary"
                size="medium"
                style={isEditing ? styles.disabledButton : styles.editBtn}
                disabled={isEditing}
              />
            </View>
          </View>

          {/* Basic Information Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Basic Information</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={styles.infoLabel}>Full Name</Text>
              </View>
              <View style={styles.infoValueCol}>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.name}
                    onChangeText={(value) => handleFieldChange("name", value)}
                    placeholder="Enter your name"
                    placeholderTextColor="#888"
                  />
                ) : (
                  <Text
                    style={styles.infoValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {editedInfo.name || "Not set"}
                  </Text>
                )}
              </View>
            </View>
            {validationErrors.name && (
              <Text style={styles.errorText}>{validationErrors.name}</Text>
            )}
            {isEditing && fieldChanges.name === false && editedInfo.name && (
              <Text style={styles.guideText}>No changes made to name</Text>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <View style={styles.infoValueCol}>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={editedInfo.email}
                    editable={false}
                    placeholder="Enter your email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text
                    style={styles.infoValue}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {editedInfo.email || "Not set"}
                  </Text>
                )}
              </View>
            </View>
            {validationErrors.email && (
              <Text style={styles.errorText}>{validationErrors.email}</Text>
            )}
            {isEditing && fieldChanges.email === false && editedInfo.email && (
              <Text style={styles.guideText}>Email is not editable</Text>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <View style={styles.infoValueCol}>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.phone}
                    onChangeText={(value) => handleFieldChange("phone", value)}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    maxLength={11}
                  />
                ) : (
                  <Text style={styles.infoValue}>
                    {editedInfo.phone || "Not set"}
                  </Text>
                )}
              </View>
            </View>
            {validationErrors.phone && (
              <Text style={styles.errorText}>{validationErrors.phone}</Text>
            )}
            {isEditing && fieldChanges.phone === false && editedInfo.phone && (
              <Text style={styles.guideText}>No changes made to phone</Text>
            )}

            <View style={styles.infoRow}>
              <View style={styles.infoLabelCol}>
                <Text style={styles.infoLabel}>Date of Birth</Text>
              </View>
              <View style={styles.infoValueCol}>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.input}>
                      {editedInfo.dob || "Select date"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoValue}>
                    {editedInfo.dob || "Not set"}
                  </Text>
                )}
              </View>
            </View>
            {validationErrors.dob && (
              <Text style={styles.errorText}>{validationErrors.dob}</Text>
            )}
            {isEditing && fieldChanges.dob === false && editedInfo.dob && (
              <Text style={styles.guideText}>
                No changes made to date of birth
              </Text>
            )}
          </View>

          {/* Bottom Action Buttons */}
          {isEditing && (
            <View style={styles.bottomActions}>
              <Button
                title="Save"
                onPress={handleSave}
                variant="primary"
                size="medium"
                style={
                  isSaveDisabled() ? styles.disabledButton : styles.saveBtn
                }
                disabled={isSaveDisabled()}
              />
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="secondary"
                size="medium"
                style={styles.cancelBtn}
              />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
      {renderDatePicker()}

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePreview(false)}
        >
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: profileImage || "" }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    left: 16,
    top: 20,
    padding: 8,
    zIndex: 1,
  },
  avatarWrapper: {
    position: "relative",
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginTop: 20,
  },
  avatarEditBtn: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 20,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  uploadBtn: {
    marginTop: 10,
    minWidth: 140,
    backgroundColor: "#222",
    height: 43,
  },
  editBtn: {
    marginTop: 10,
    minWidth: 160,
    backgroundColor: "#222",
    height: 43,
  },
  card: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  infoLabelCol: {
    flex: 1,
  },
  infoValueCol: {
    flex: 2,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  infoLabel: {
    fontSize: 15,
    color: "#888",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#222",
    textAlign: "right",
    flexShrink: 1,
  },
  input: {
    fontSize: 15,
    color: "#222",
    padding: 0,
    textAlign: "right",
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  saveBtn: {
    minWidth: 160,
    backgroundColor: "#4CAF50",
    marginTop: 10,
  },
  cancelBtn: {
    minWidth: 160,
    backgroundColor: "#f44336",
    marginTop: 10,
  },
  errorText: {
    color: "#f44336",
    fontSize: 11,
    marginTop: -20,
    marginBottom: 16,
    marginLeft: 16,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    minWidth: 160,
    marginTop: 10,
  },
  guideText: {
    color: "#666",
    fontSize: 11,
    marginTop: -20,
    marginBottom: 16,
    marginLeft: 16,
    fontStyle: "italic",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  datePickerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 200,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerItem: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  datePickerItemSelected: {
    backgroundColor: "#222",
  },
  datePickerItemText: {
    fontSize: 16,
    color: "#222",
  },
  datePickerItemTextSelected: {
    color: "#fff",
  },
  datePickerFooter: {
    marginTop: 20,
    alignItems: "center",
  },
  confirmButton: {
    minWidth: 120,
  },
  dateInput: {
    flex: 1,
    alignItems: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  disabledInput: {
    color: "#888",
    opacity: 0.7,
  },
});

export default PersonalInfoScreen;
