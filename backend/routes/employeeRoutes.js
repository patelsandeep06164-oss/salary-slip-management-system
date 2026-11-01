
const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { verifyCsrfToken } = require("../middleware/csrfMiddleware");

// All employee routes require authentication.
router.use(authMiddleware);

// Get all employees (Admin only).
router.get(
  "/",
  roleMiddleware("admin"),
  employeeController.getEmployees
);

// Create employee (Admin only).
router.post(
  "/",
  roleMiddleware("admin"),
  verifyCsrfToken,
  employeeController.createEmployee
);

// Get employee by ID (Admin or own Employee profile).
router.get(
  "/:id",
  employeeController.getEmployeeById
);

// Update employee (Admin only).
router.patch(
  "/:id",
  roleMiddleware("admin"),
  verifyCsrfToken,
  employeeController.updateEmployee
);

// Deactivate employee (Admin only).
router.delete(
  "/:id",
  roleMiddleware("admin"),
  verifyCsrfToken,
  employeeController.deactivateEmployee
);

module.exports = router;
