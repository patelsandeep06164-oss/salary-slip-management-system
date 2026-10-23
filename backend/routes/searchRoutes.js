
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const searchController = require("../controllers/searchController");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "hr"),
  searchController.globalSearch
);

module.exports = router;
