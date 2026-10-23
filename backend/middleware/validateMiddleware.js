
const mongoose = require("mongoose");

const validateMiddleware = (schema = {}) => {
  return (req, res, next) => {
    const errors = [];

    const sources = {
      body: req.body || {},
      params: req.params || {},
      query: req.query || {},
    };

    for (const [sourceName, fields] of Object.entries(schema)) {
      if (!sources[sourceName] || !fields) {
        continue;
      }

      const data = sources[sourceName];

      for (const [fieldName, rules] of Object.entries(fields)) {
        const value = data[fieldName];
        const fieldRules =
          typeof rules === "string" ? { type: rules } : rules;

        const isMissing =
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "");

        if (fieldRules.required && isMissing) {
          errors.push(`${fieldName} is required.`);
          continue;
        }

        if (isMissing) {
          continue;
        }

        if (fieldRules.type && typeof value !== fieldRules.type) {
          errors.push(`${fieldName} must be a ${fieldRules.type}.`);
          continue;
        }

        if (
          typeof value === "string" &&
          fieldRules.minLength !== undefined &&
          value.length < fieldRules.minLength
        ) {
          errors.push(
            `${fieldName} must be at least ${fieldRules.minLength} characters.`
          );
        }

        if (
          typeof value === "string" &&
          fieldRules.maxLength !== undefined &&
          value.length > fieldRules.maxLength
        ) {
          errors.push(
            `${fieldName} must not exceed ${fieldRules.maxLength} characters.`
          );
        }

        if (
          typeof value === "string" &&
          fieldRules.pattern &&
          !fieldRules.pattern.test(value)
        ) {
          errors.push(fieldRules.message || `${fieldName} format is invalid.`);
        }

        if (
          typeof value === "string" &&
          fieldRules.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          errors.push(`${fieldName} must be a valid email address.`);
        }

        if (
          fieldRules.enum &&
          !fieldRules.enum.includes(value)
        ) {
          errors.push(
            `${fieldName} must be one of: ${fieldRules.enum.join(", ")}.`
          );
        }

        if (
          fieldRules.mongoId &&
          (typeof value !== "string" ||
            !mongoose.isValidObjectId(value))
        ) {
          errors.push(`${fieldName} must be a valid ID.`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Request validation failed.",
        errors,
      });
    }

    next();
  };
};

module.exports = validateMiddleware;
