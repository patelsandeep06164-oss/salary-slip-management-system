const express = require("express");
const router = express.Router();

const emailController = require("../controllers/emailController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

// Only Admin can view email logs.
router.get(
  "/logs",
  roleMiddleware("admin"),
  emailController.getEmailLogs
);

// Only Admin can retry failed salary slip emails.
router.post(
  "/retry/:id",
  roleMiddleware("admin"),
  emailController.retrySalarySlipEmail
);

module.exports = router;