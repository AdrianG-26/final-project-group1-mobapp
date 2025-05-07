import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { getUsers } from "../../utils/storage";
import { validateEmail } from "../../utils/validation";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const users = await getUsers();
      const user = users.find((u) => u.email === email);

      if (user) {
        // In a real app, we would send a password reset email here
        // For this demo, we'll just show a success message
        setSuccess(true);
        setError("");
      } else {
        setError("No account found with this email");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred. Please try again.");
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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset
            your password
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
              setSuccess(false);
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />

          {success && (
            <Text style={styles.successText}>
              Password reset instructions have been sent to your email
            </Text>
          )}

          <Button
            title="Send Reset Instructions"
            onPress={handleResetPassword}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
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
    marginTop: 60,
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
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  button: {
    marginBottom: 24,
  },
  backButton: {
    alignItems: "center",
  },
  backButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  successText: {
    color: "#34C759",
    fontSize: 14,
    marginBottom: 16,
  },
});

export default ForgotPasswordScreen;
