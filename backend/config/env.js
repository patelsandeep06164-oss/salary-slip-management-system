
require("dotenv").config();

const requiredEnvVariables = [
  "PORT",
  "MONGODB_URI",
  "JWT_SECRET",
];

const validateEnv = () => {
  const missingVariables = requiredEnvVariables.filter((key) => {
    return !process.env[key] || !process.env[key].trim();
  });

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`
    );
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    );
  }

  const port = Number(process.env.PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number.");
  }

  console.log("Environment variables validated successfully.");
};

module.exports = { validateEnv };
