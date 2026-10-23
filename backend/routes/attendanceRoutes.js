
const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.post(
  "/",
  roleMiddleware("admin", "hr"),
  attendanceController.markAttendance
);

router.post("/check-in", attendanceController.checkIn);

router.patch("/check-out", attendanceController.checkOut);

router.get("/summary", attendanceController.getMonthlySummary);

router.get("/", attendanceController.getAttendance);

module.exports = router;
