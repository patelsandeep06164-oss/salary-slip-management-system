export function isRequired(value) {
  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim().length > 0;
}

export function validateEmail(email) {
  if (!isRequired(email)) {
    return false;
  }

  const value = String(email).trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function validatePhone(phone) {
  if (!isRequired(phone)) {
    return false;
  }

  // Accepts Indian 10-digit numbers and optional +91 prefix.
  const value = String(phone).replace(/[\s()-]/g, "");

  return /^(?:\+91)?[6-9]\d{9}$/.test(value);
}

export function validatePassword(password) {
  if (typeof password !== "string") {
    return false;
  }

  // Minimum 8 characters, at least one letter and one number.
  return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
}

export function validatePasswordConfirmation(
  password,
  confirmPassword
) {
  return (
    typeof password === "string" &&
    typeof confirmPassword === "string" &&
    password === confirmPassword
  );
}

export function validateSalary(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0;
}

export function validatePositiveNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number > 0;
}

export function validatePercentage(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 && number <= 100;
}

export function validateDate(value) {
  if (!isRequired(value)) {
    return false;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const date = new Date(year, month - 1, day);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      );
    }
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

export function validateDateRange(startDate, endDate) {
  if (!validateDate(startDate) || !validateDate(endDate)) {
    return false;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Compare date-only strings as calendar dates.
  if (
    typeof startDate === "string" &&
    typeof endDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return startDate <= endDate;
  }

  return start.getTime() <= end.getTime();
}

export function validateWebsite(url) {
  if (!isRequired(url)) {
    return true;
  }

  const value = String(url).trim();

  try {
    const normalizedUrl = /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;

    const parsedUrl = new URL(normalizedUrl);

    return (
      (parsedUrl.protocol === "http:" ||
        parsedUrl.protocol === "https:") &&
      parsedUrl.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

export function validateEmployee(employee) {
  const errors = {};

  if (!isRequired(employee?.name)) {
    errors.name = "Employee name is required.";
  }

  if (!isRequired(employee?.employeeId)) {
    errors.employeeId = "Employee ID is required.";
  }

  if (!validateEmail(employee?.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (employee?.phone && !validatePhone(employee.phone)) {
    errors.phone = "Enter a valid Indian mobile number.";
  }

  if (
    employee?.salary !== undefined &&
    employee?.salary !== "" &&
    !validateSalary(employee.salary)
  ) {
    errors.salary =
      "Salary must be a valid non-negative amount.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateLogin(credentials) {
  const errors = {};

  if (!validateEmail(credentials?.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isRequired(credentials?.password)) {
    errors.password = "Password is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCompanySettings(settings) {
  const errors = {};

  if (!isRequired(settings?.companyName)) {
    errors.companyName = "Company name is required.";
  }

  if (settings?.email && !validateEmail(settings.email)) {
    errors.email = "Enter a valid company email address.";
  }

  if (settings?.phone && !validatePhone(settings.phone)) {
    errors.phone = "Enter a valid Indian mobile number.";
  }

  if (settings?.website && !validateWebsite(settings.website)) {
    errors.website = "Enter a valid website URL.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default {
  isRequired,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePasswordConfirmation,
  validateSalary,
  validatePositiveNumber,
  validatePercentage,
  validateDate,
  validateDateRange,
  validateWebsite,
  validateEmployee,
  validateLogin,
  validateCompanySettings,
};