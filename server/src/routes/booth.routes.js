const express = require("express");

const {
  createBooth,
  getAllBooths,
  getBoothById,
  updateBooth,
  assignCoordinator,
  assignSectorOfficer,
  updateBoothStatus,
} = require("../controllers/booth.controller");

const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("PARTY_ADMIN"),
  createBooth
);

router.get(
  "/",
  protect,
  authorize("PARTY_ADMIN"),
  getAllBooths
);

router.get(
  "/:id",
  protect,
  authorize("PARTY_ADMIN"),
  getBoothById
);

router.put(
  "/:id",
  protect,
  authorize("PARTY_ADMIN"),
  updateBooth
);

router.patch(
  "/:id/assign-coordinator",
  protect,
  authorize("PARTY_ADMIN"),
  assignCoordinator
);

router.patch(
  "/:id/assign-sector-officer",
  protect,
  authorize("PARTY_ADMIN"),
  assignSectorOfficer
);

router.patch(
  "/:id/status",
  protect,
  authorize("PARTY_ADMIN"),
  updateBoothStatus
);

module.exports = router;