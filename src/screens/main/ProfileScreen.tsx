import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Alert,
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
import { MainStackParamList, RootStackParamList } from "../../types/index";
import { getUsers, makeUserAdmin } from "../../utils/storage";

type ProfileNavigationProp = NativeStackNavigationProp<MainStackParamList>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const rootNavigation = useNavigation<RootNavigationProp>();
  const { user, logout } = useAuth();

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
        // Navigate to personal information screen
      },
    },
    {
      icon: "map-marker-outline",
      title: "Shipping Addresses",
      onPress: () => {
        // Navigate to shipping addresses screen
      },
    },
    {
      icon: "credit-card-outline",
      title: "Payment Methods",
      onPress: () => {
        // Navigate to payment methods screen
      },
    },
    {
      icon: "bell-outline",
      title: "Notifications",
      onPress: () => {
        // Navigate to notifications screen
      },
    },
    {
      icon: "help-circle-outline",
      title: "Help & Support",
      onPress: () => {
        // Navigate to help & support screen
      },
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
                <Text style={styles.menuItemText}>{item.title}</Text>
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
  menuItemText: {
    fontSize: 16,
    color: "#000",
    marginLeft: 16,
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
});

export default ProfileScreen;
