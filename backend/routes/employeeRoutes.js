const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All employee routes require authentication
router.use(authMiddleware);

// Get all employees (admin/HR only)
router.get(
  "/",
  roleMiddleware("admin", "hr"),
  employeeController.getEmployees
);

// Create employee (admin/HR only)
router.post(
  "/",
  roleMiddleware("admin", "hr"),
  employeeController.createEmployee
);

// Get employee by ID (admin/HR or the employee's own profile)
router.get("/:id", employeeController.getEmployeeById);

// Update employee (admin/HR only)
router.patch(
  "/:id",
  roleMiddleware("admin", "hr"),
  employeeController.updateEmployee
);

// Deactivate employee (admin only)
router.delete(
  "/:id",
  roleMiddleware("admin"),
  employeeController.deactivateEmployee
);

module.exports = router;
