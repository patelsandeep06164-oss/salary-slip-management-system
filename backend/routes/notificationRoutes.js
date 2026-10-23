const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Only authenticated admins can access notifications
router.use(authMiddleware, roleMiddleware("admin"));

// Get notifications and unread count
router.get("/", notificationController.getNotifications);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);

// Mark one notification as read
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
