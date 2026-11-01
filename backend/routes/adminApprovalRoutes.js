
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  verifyCsrfToken,
} = require("../middleware/csrfMiddleware");

const adminApprovalController = require(
  "../controllers/adminApprovalController"
);

// Every approval route requires an authenticated Admin.
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

// Get pending Admin registrations.
router.get(
  "/approvals",
  adminApprovalController.getPendingAdmins
);

// Approve a pending Admin.
router.patch(
  "/approvals/:id/approve",
  verifyCsrfToken,
  adminApprovalController.approveAdmin
);

// Reject a pending Admin.
router.patch(
  "/approvals/:id/reject",
  verifyCsrfToken,
  adminApprovalController.rejectAdmin
);

module.exports = router;
