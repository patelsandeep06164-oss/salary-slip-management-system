
const express = require("express");
const router = express.Router();

const departmentController = require("../controllers/departmentController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/", departmentController.getDepartments);

router.get("/:id", departmentController.getDepartmentById);

router.post(
  "/",
  roleMiddleware("admin", "hr"),
  departmentController.createDepartment
);

router.put(
  "/:id",
  roleMiddleware("admin", "hr"),
  departmentController.updateDepartment
);

router.patch(
  "/:id/deactivate",
  roleMiddleware("admin"),
  departmentController.deactivateDepartment
);

module.exports = router;
