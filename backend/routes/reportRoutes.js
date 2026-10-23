
const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);
router.use(roleMiddleware("admin", "hr"));

router.get("/dashboard", reportController.getDashboardReport);

router.get("/payroll", reportController.getPayrollReport);

router.get("/attendance", reportController.getAttendanceReport);

router.get("/employees", reportController.getEmployeeReport);

module.exports = router;
