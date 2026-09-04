const express = require("express");

const {
  createSectorOfficer,
  createBoothCoordinator,
  getAllUsers,
  updateUser,
} = require("../controllers/user.controller");

const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  protect,
  authorize("PARTY_ADMIN"),
  getAllUsers
);

router.post(
  "/sector-officer",
  protect,
  authorize("PARTY_ADMIN"),
  createSectorOfficer
);

router.post(
  "/booth-coordinator",
  protect,
  authorize("PARTY_ADMIN"),
  createBoothCoordinator
);

router.put(
  "/:id",
  protect,
  authorize("PARTY_ADMIN"),
  updateUser
);

module.exports = router;