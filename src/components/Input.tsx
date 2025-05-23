import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { validateEmail } from "../utils/validation";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: TextStyle;
  errorStyle?: TextStyle;
  validateOnChange?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  validateOnChange = false,
  keyboardType,
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(error);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const handleChangeText = (text: string) => {
    if (validateOnChange && keyboardType === "email-address" && text) {
      const isValid = validateEmail(text);
      setLocalError(isValid ? undefined : "Please enter a valid email address");
    } else {
      setLocalError(undefined);
    }
    onChangeText?.(text);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          (localError || error) && styles.errorInput,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor="#999"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChangeText={handleChangeText}
          keyboardType={keyboardType}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(localError || error) && (
        <Text style={[styles.error, errorStyle]}>{localError || error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  focusedInput: {
    borderColor: "#000",
  },
  errorInput: {
    borderColor: "#ff3b30",
  },
  error: {
    color: "#ff3b30",
    fontSize: 14,
    marginTop: 4,
  },
  leftIcon: {
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  rightIcon: {
    paddingHorizontal: 10,
    justifyContent: "center",
  },
});

export default Input;
