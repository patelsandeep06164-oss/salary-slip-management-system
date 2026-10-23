
const express = require("express");
const router = express.Router();

const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.post("/", leaveController.applyLeave);

router.get("/", leaveController.getLeaves);

router.patch(
  "/:id/review",
  roleMiddleware("admin", "hr"),
  leaveController.reviewLeave
);

router.patch("/:id/cancel", leaveController.cancelLeave);

module.exports = router;
