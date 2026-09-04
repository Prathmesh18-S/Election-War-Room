const express = require("express");
const { getCoordinatorDashboard } = require("../controllers/coordinator.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("BOOTH_COORDINATOR"),
  getCoordinatorDashboard
);

module.exports = router;
