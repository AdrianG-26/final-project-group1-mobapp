import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../context/AuthContext";
import { AuthStackParamList } from "../../types";
import { getUsers, saveUser } from "../../utils/storage";
import { validateEmail, validatePassword } from "../../utils/validation";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const SignupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password =
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!, @, $, %, ^, &, *, +, #)";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check for duplicate email
      const users = await getUsers();
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        setErrors({ email: "An account with this email already exists" });
        setLoading(false);
        return;
      }

      const newUser = {
        id: uuidv4(),
        name,
        email,
        password,
        isAdmin,
      };

      await saveUser(newUser);
      await login(newUser);
      Alert.alert(
        "Signup Successful",
        "Your account has been created! You are now logged in.",
        [
          {
            text: "OK",
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Signup Error",
        "An error occurred during signup. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start shopping for your favorite shoes
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
          />

          <View style={styles.adminToggle}>
            <Text style={styles.adminLabel}>Create as Admin</Text>
            <Switch
              value={isAdmin}
              onValueChange={setIsAdmin}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isAdmin ? "#000" : "#f4f3f4"}
            />
          </View>

          <Button
            title="Sign Up"
            onPress={handleSignup}
            loading={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    gap: 16,
  },
  adminToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  adminLabel: {
    fontSize: 16,
    color: "#000",
  },
  button: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#666",
  },
  footerLink: {
    color: "#000",
    fontWeight: "600",
  },
});

export default SignupScreen;
