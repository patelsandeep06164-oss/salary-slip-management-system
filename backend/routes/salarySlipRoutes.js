
const express = require("express");
const router = express.Router();

const salarySlipController = require("../controllers/salarySlipController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All salary slip routes require authentication.
router.use(authMiddleware);

// Only Admin can generate a salary slip.
router.post(
  "/generate",
  roleMiddleware("admin"),
  salarySlipController.generateSalarySlip
);

// Only Admin can email a salary slip.
router.post(
  "/email/:id",
  roleMiddleware("admin"),
  salarySlipController.emailSalarySlip
);

// Only Admin can process monthly salary slips.
router.post(
  "/process-monthly",
  roleMiddleware("admin"),
  salarySlipController.generateAndEmailMonthlySalarySlips
);

// Admin can view all slips.
// Employee can view only their own slips (controller ownership filter).
router.get("/", salarySlipController.getSalarySlips);

// Employee can download only their own PDF.
router.get(
  "/:id/download",
  salarySlipController.downloadSalarySlipPdf
);

// Employee can view only their own slip details.
router.get("/:id", salarySlipController.getSalarySlipById);

module.exports = router;
