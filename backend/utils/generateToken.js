const jwt = require("jsonwebtoken");

const generateeToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const userId = user?._id || user?.id;

  if (!userId) {
    throw new TypeError("A valid user ID is required to generate a token.");
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  return jwt.sign(
    {
      id: userId.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn,
      issuer: "salary-slip-api",
    }
  );
};

module.exports = generateeToken;
