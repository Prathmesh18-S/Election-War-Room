const express = require("express");

const {
  startActivity,
  getAllActivities,
  getActivityDashboard,
  getActivityByBooth,
  updateActivity,
} = require(
  "../controllers/coordinatorActivity.controller"
);

const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("BOOTH_COORDINATOR"),
  startActivity
);

router.get(
  "/",
  protect,
  authorize("PARTY_ADMIN"),
  getAllActivities
);

router.get(
  "/dashboard",
  protect,
  authorize("PARTY_ADMIN"),
  getActivityDashboard
);

router.get(
  "/booth/:boothId",
  protect,
  authorize("PARTY_ADMIN"),
  getActivityByBooth
);

router.put(
  "/:id",
  protect,
  authorize("BOOTH_COORDINATOR"),
  updateActivity
);

module.exports = router;