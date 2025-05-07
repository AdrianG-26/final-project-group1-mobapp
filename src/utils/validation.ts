export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@$%^&*+#]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[a-zA-Z\s]*$/.test(name);
};

export const validateProductName = (name: string): boolean => {
  return name.length >= 3;
};

export const validatePrice = (price: number): boolean => {
  return price > 0 && price <= 10000;
};

export const validateStock = (stock: number): boolean => {
  return stock >= 0 && Number.isInteger(stock);
};

export const validateSize = (size: string): boolean => {
  const validSizes = [
    "US5",
    "US6",
    "US7",
    "US8",
    "US9",
    "US10",
    "US11",
    "US12",
  ];
  return validSizes.includes(size);
};

export const getValidationError = (field: string, value: any): string => {
  switch (field) {
    case "email":
      return !validateEmail(value) ? "Please enter a valid email address" : "";
    case "password":
      return !validatePassword(value)
        ? "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number"
        : "";
    case "name":
      return !validateName(value)
        ? "Name must be at least 2 characters and contain only letters"
        : "";
    case "productName":
      return !validateProductName(value)
        ? "Product name must be at least 3 characters"
        : "";
    case "price":
      return !validatePrice(value)
        ? "Price must be greater than 0 and less than 10000"
        : "";
    case "stock":
      return !validateStock(value)
        ? "Stock must be a non-negative integer"
        : "";
    case "size":
      return !validateSize(value) ? "Please select a valid size" : "";
    default:
      return "";
  }
};
