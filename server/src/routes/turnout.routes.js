const express = require("express");

const {
  submitTurnout,
  getAllTurnout,
  getBoothTurnout,
  updateTurnout,
  getTurnoutDashboard,
} = require("../controllers/turnout.controller");

const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize(
    "BOOTH_COORDINATOR",
    "PARTY_ADMIN"
  ),
  submitTurnout
);

router.get(
  "/",
  protect,
  authorize(
    "PARTY_ADMIN",
    "SECTOR_OFFICER"
  ),
  getAllTurnout
);

router.get(
  "/booth/:boothId",
  protect,
  authorize(
    "PARTY_ADMIN",
    "SECTOR_OFFICER"
  ),
  getBoothTurnout
);

router.put(
  "/:id",
  protect,
  authorize(
    "PARTY_ADMIN",
    "SECTOR_OFFICER"
  ),
  updateTurnout
);

router.get(
  "/dashboard",
  protect,
  authorize("PARTY_ADMIN"),
  getTurnoutDashboard
);

module.exports = router;

