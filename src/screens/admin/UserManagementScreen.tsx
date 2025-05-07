import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { User } from "../../types";
import { deleteUser, getUsers, makeUserAdmin } from "../../utils/storage";

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            const success = await deleteUser(user.id);
            if (success) {
              Alert.alert("Success", "User deleted successfully");
              loadUsers(); // Reload the user list
            } else {
              Alert.alert("Error", "Failed to delete user");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleMakeAdmin = async (user: User) => {
    if (user.isAdmin) {
      Alert.alert("Info", "This user is already an admin");
      return;
    }

    Alert.alert(
      "Make Admin",
      `Are you sure you want to make ${user.name} an admin?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            const success = await makeUserAdmin(user.email);
            if (success) {
              Alert.alert("Success", "User is now an admin");
              loadUsers(); // Reload the user list
            } else {
              Alert.alert("Error", "Failed to make user an admin");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {item.isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        {!item.isAdmin && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMakeAdmin(item)}
          >
            <Icon name="shield-account" size={24} color="#4CAF50" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteUser(item)}
        >
          <Icon name="delete" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadUsers}>
          <Icon name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.userList}
        refreshing={loading}
        onRefresh={loadUsers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 8,
  },
  userList: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  adminBadge: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  adminBadgeText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default UserManagementScreen;
