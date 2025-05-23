import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
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
import Icon from "react-native-vector-icons/Ionicons";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { getUsers, updateUserPassword } from "../../utils/storage";
import { validateEmail } from "../../utils/validation";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"email" | "verify" | "reset">("email");

  const generateVerificationCode = () => {
    // Generate a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async () => {
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
        // In a real app, we would send this code via email
        // For this demo, we'll just show it in an alert
        const code = generateVerificationCode();
        setGeneratedCode(code);
        Alert.alert(
          "Verification Code",
          `Your verification code is: ${code}\n\n(In a real app, this would be sent to your email)`,
          [
            {
              text: "OK",
              onPress: () => {
                setVerificationCode("");
                setStep("verify");
                setError("");
              },
            },
          ]
        );
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

  const handleVerifyCode = () => {
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    // Compare the entered code with the generated code
    if (verificationCode === generatedCode) {
      setStep("reset");
      setError("");
    } else {
      setError("Invalid verification code");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password requirements
    const hasMinLength = newPassword.length >= 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(
      newPassword
    );

    if (
      !hasMinLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumber ||
      !hasSpecialChar
    ) {
      setError(
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character"
      );
      return;
    }

    setLoading(true);
    try {
      // Get the user to check current password
      const users = await getUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        setError("User not found");
        return;
      }

      // Check if new password is the same as current password
      if (user.password === newPassword) {
        setError("New password must be different from your current password");
        return;
      }

      const success = await updateUserPassword(email, newPassword);
      if (success) {
        setSuccess(true);
        setError("");
        Alert.alert(
          "Success",
          "Your password has been reset successfully. You can now login with your new password.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("Login");
              },
            },
          ]
        );
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
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
        validateOnChange={true}
      />

      {success && (
        <Text style={styles.successText}>
          Password reset instructions have been sent to your email
        </Text>
      )}

      <Button
        title="Send Reset Code"
        onPress={handleSendCode}
        loading={loading}
        style={styles.button}
      />
    </>
  );

  const renderVerifyStep = () => (
    <>
      <Input
        label="Verification Code"
        value={verificationCode}
        onChangeText={(text) => {
          setVerificationCode(text);
          setError("");
        }}
        placeholder="Enter 6-digit code"
        keyboardType="number-pad"
        maxLength={6}
        error={error}
      />

      <Button
        title="Verify Code"
        onPress={handleVerifyCode}
        loading={loading}
        style={styles.button}
      />
    </>
  );

  const renderResetStep = () => (
    <>
      <Input
        label="New Password"
        value={newPassword}
        onChangeText={(text) => {
          setNewPassword(text);
          setError("");
        }}
        placeholder="Enter new password"
        secureTextEntry={!showPassword}
        error={error}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
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
        onChangeText={(text) => {
          setConfirmPassword(text);
          setError("");
        }}
        placeholder="Confirm new password"
        secureTextEntry={!showConfirmPassword}
        error={error}
        rightIcon={
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Icon
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        }
      />

      {success && (
        <Text style={styles.successText}>
          Password has been reset successfully!
        </Text>
      )}

      <Button
        title="Reset Password"
        onPress={handleResetPassword}
        loading={loading}
        style={styles.button}
      />
    </>
  );

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
            {step === "email" &&
              "Enter your email address and we'll send you a verification code"}
            {step === "verify" &&
              "Enter the verification code sent to your email"}
            {step === "reset" && "Enter your new password"}
          </Text>
        </View>

        <View style={styles.form}>
          {step === "email" && renderEmailStep()}
          {step === "verify" && renderVerifyStep()}
          {step === "reset" && renderResetStep()}

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
