import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button";

const PersonalInfoScreen = () => {
  const { user } = useAuth();

  // Placeholder handlers
  const handleEditProfile = () => {};
  const handleShare = () => {};
  const handleEditField = (field: string) => {
    console.log(`Editing field: ${field}`);
    // TODO: Implement field editing functionality
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Icon name="account-circle" size={90} color="#222" />
            <TouchableOpacity style={styles.avatarEditBtn}>
              <Icon name="camera" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.name || "Full Name"}</Text>
          <Text style={styles.role}>UI/UX Designer</Text>
          <View style={styles.actionRow}>
            <Button
              title="Edit Profile"
              onPress={handleEditProfile}
              variant="primary"
              size="medium"
              style={styles.editBtn}
            />
            <Button
              title="Share"
              onPress={handleShare}
              variant="secondary"
              size="medium"
              style={styles.shareBtn}
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
              <Text style={styles.infoValue}>{user?.name || "Alexander Morgan"}</Text>
              <TouchableOpacity onPress={() => handleEditField("name")}> 
                <Icon name="pencil" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelCol}>
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            <View style={styles.infoValueCol}>
              <Text style={styles.infoValue}>{user?.email || "alex.morgan@example.com"}</Text>
              <TouchableOpacity onPress={() => handleEditField("email")}> 
                <Icon name="pencil" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelCol}>
              <Text style={styles.infoLabel}>Phone</Text>
            </View>
            <View style={styles.infoValueCol}>
              <Text style={styles.infoValue}>+1 (555) 123-4567</Text>
              <TouchableOpacity onPress={() => handleEditField("phone")}> 
                <Icon name="pencil" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelCol}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
            </View>
            <View style={styles.infoValueCol}>
              <Text style={styles.infoValue}>May 15, 1988</Text>
              <TouchableOpacity onPress={() => handleEditField("dob")}> 
                <Icon name="pencil" size={18} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 0,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
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
    marginBottom: 2,
  },
  role: {
    fontSize: 15,
    color: "#888",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  editBtn: {
    minWidth: 120,
  },
  shareBtn: {
    minWidth: 90,
    backgroundColor: "#e0e0e0",
  },
  card: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  infoLabelCol: {
    flex: 1,
  },
  infoValueCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 2,
    justifyContent: "flex-end",
  },
  infoLabel: {
    fontSize: 15,
    color: "#888",
  },
  infoValue: {
    fontSize: 15,
    color: "#222",
    marginRight: 8,
  },
});

export default PersonalInfoScreen;
