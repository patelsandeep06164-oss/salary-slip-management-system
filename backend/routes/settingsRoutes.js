
const express = require("express");
const router = express.Router();

const settingsController = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware("admin", "hr"),
  settingsController.getSettings
);

router.put(
  "/",
  roleMiddleware("admin"),
  settingsController.updateSettings
);

module.exports = router;
