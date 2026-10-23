
const express = require("express");
const router = express.Router();

const salarySlipController = require("../controllers/salarySlipController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.post(
  "/generate",
  roleMiddleware("admin", "hr"),
  salarySlipController.generateSalarySlip
);

router.post(
  "/email/:id",
  roleMiddleware("admin", "hr"),
  salarySlipController.emailSalarySlip
);

router.post(
  "/process-monthly",
  roleMiddleware("admin"),
  salarySlipController.generateAndEmailMonthlySalarySlips
);

router.get("/", salarySlipController.getSalarySlips);

router.get(
  "/:id/download",
  salarySlipController.downloadSalarySlipPdf
);

router.get("/:id", salarySlipController.getSalarySlipById);

module.exports = router;
