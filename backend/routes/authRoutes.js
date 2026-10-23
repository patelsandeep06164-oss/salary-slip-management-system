
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Get logged-in user's profile
router.get(
  "/me",
  authMiddleware,
  profileController.getMyProfile
);

// Update logged-in user's profile
router.patch(
  "/profile",
  authMiddleware,
  profileController.updateMyProfile
);

// Change password
router.patch(
  "/change-password",
  authMiddleware,
  authController.changePassword
);

module.exports = router;
