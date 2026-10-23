
const express = require("express");
const router = express.Router();

const emailController = require("../controllers/emailController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get(
  "/logs",
  roleMiddleware("admin", "hr"),
  emailController.getEmailLogs
);

router.post(
  "/retry/:id",
  roleMiddleware("admin", "hr"),
  emailController.retrySalarySlipEmail
);

module.exports = router;
