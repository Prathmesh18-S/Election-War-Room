const express = require("express");
const { getSectorDashboard } = require("../controllers/sector.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("SECTOR_OFFICER"),
  getSectorDashboard
);

module.exports = router;
