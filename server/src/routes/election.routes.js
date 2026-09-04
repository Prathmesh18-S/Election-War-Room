const express = require("express");

const {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  updateElectionStatus,
} = require("../controllers/election.controller");

const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("PARTY_ADMIN"),
  createElection
);

router.get(
  "/",
  protect,
  authorize("PARTY_ADMIN"),
  getAllElections
);

router.get(
  "/:id",
  protect,
  authorize("PARTY_ADMIN"),
  getElectionById
);

router.put(
  "/:id",
  protect,
  authorize("PARTY_ADMIN"),
  updateElection
);

router.patch(
  "/:id/status",
  protect,
  authorize("PARTY_ADMIN"),
  updateElectionStatus
);

module.exports = router;