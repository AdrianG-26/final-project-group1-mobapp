import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { v4 as uuidv4 } from "uuid";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useAuth } from "../../context/AuthContext";
import { User } from "../../types";
import { getUsers, saveUser } from "../../utils/storage";

const SignupScreen = () => {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error states for each field
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [existingUsers, setExistingUsers] = useState<User[]>([]);

  // Fetch existing users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers();
      setExistingUsers(users);
    };
    fetchUsers();
  }, []);

  // Validate name when it changes
  useEffect(() => {
    if (name === "") {
      setNameError("");
    } else if (name.length < 3) {
      setNameError("Name must be at least 3 characters long");
    } else {
      setNameError("");
    }
  }, [name]);

  // Validate email when it changes
  useEffect(() => {
    if (email === "") {
      setEmailError("");
      return;
    }

    // RFC 5322 compliant email regex
    const emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
    } else if (
      existingUsers.some(
        (user) => user.email.toLowerCase() === email.toLowerCase()
      )
    ) {
      setEmailError("An account with this email already exists");
    } else {
      setEmailError("");
    }
  }, [email, existingUsers]);

  // Validate password when it changes
  useEffect(() => {
    if (password === "") {
      setPasswordError("");
      return;
    }

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
      password
    );

    const allRequirementsMet =
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar;

    if (!allRequirementsMet) {
      const errors = [];
      if (!hasMinLength) errors.push("At least 8 characters");
      if (!hasUpperCase) errors.push("At least 1 uppercase letter");
      if (!hasLowerCase) errors.push("At least 1 lowercase letter");
      if (!hasNumber) errors.push("At least 1 number");
      if (!hasSpecialChar) errors.push("At least 1 special character");

      setPasswordError(`Password requirements: ${errors.join(", ")}`);
    } else {
      setPasswordError("");
    }
  }, [password]);

  // Validate confirm password when it or password changes
  useEffect(() => {
    if (confirmPassword === "") {
      setConfirmPasswordError("");
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  }, [confirmPassword, password]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSignup = async () => {
    // Check for any empty fields
    if (!name || !email || !password || !confirmPassword) {
      if (!name) setNameError("Name is required");
      if (!email) setEmailError("Email is required");
      if (!password) setPasswordError("Password is required");
      if (!confirmPassword)
        setConfirmPasswordError("Please confirm your password");
      return;
    }

    // Check for any validation errors
    if (nameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    try {
      setLoading(true);

      // Create new user
      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        password,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };

      await saveUser(newUser);

      // Auto-login after successful signup
      const loginSuccess = await login(email, password);

      if (loginSuccess) {
        // Navigate to the main app
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        // If login fails for some reason, still show success but require manual login
        Alert.alert(
          "Account Created",
          "Your account was created successfully, but we couldn't log you in automatically. Please log in manually.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error creating account:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
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
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            error={nameError}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            error={passwordError}
            rightIcon={
              <TouchableOpacity onPress={togglePasswordVisibility}>
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            error={confirmPasswordError}
            rightIcon={
              <TouchableOpacity onPress={toggleConfirmPasswordVisibility}>
                <Icon
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            }
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            style={styles.button}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#666",
  },
  loginLink: {
    color: "#000",
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default SignupScreen;
