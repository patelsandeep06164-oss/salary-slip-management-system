
const express = require("express");
const router = express.Router();

const payrollController = require("../controllers/payrollController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.post(
  "/generate",
  roleMiddleware("admin", "hr"),
  payrollController.generatePayroll
);

router.get("/", payrollController.getPayrollRecords);

router.get("/:id", payrollController.getPayrollById);

router.patch(
  "/:id/status",
  roleMiddleware("admin", "hr"),
  payrollController.updatePayrollStatus
);

module.exports = router;
