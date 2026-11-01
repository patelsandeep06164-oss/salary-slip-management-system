const express = require("express");
const router = express.Router();

const departmentController = require("../controllers/departmentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  verifyCsrfToken,
} = require("../middleware/csrfMiddleware");

// All department routes require authentication.
router.use(authMiddleware);

// Get departments (Admin and Employee).
router.get("/", departmentController.getDepartments);

// Get department by ID (Admin and Employee).
router.get("/:id", departmentController.getDepartmentById);

// Create department (Admin only).
router.post(
  "/",
  roleMiddleware("admin"),
  verifyCsrfToken,
  departmentController.createDepartment
);

// Update department (Admin only).
router.put(
  "/:id",
  roleMiddleware("admin"),
  verifyCsrfToken,
  departmentController.updateDepartment
);

// Deactivate department (Admin only).
router.patch(
  "/:id/deactivate",
  roleMiddleware("admin"),
  verifyCsrfToken,
  departmentController.deactivateDepartment
);

module.exports = router;