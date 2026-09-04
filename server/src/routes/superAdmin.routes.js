const express = require("express");
const { getSuperAdminDashboard } = require("../controllers/superAdmin.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("SUPER_ADMIN"),
  getSuperAdminDashboard
);

module.exports = router;
