"use strict";

const express = require("express");
const {
  getTurnoutPrediction,
  getBoothHealth,
  getRiskAnalysis,
  getCoordinatorPerformance,
  getElectionHealth,
} = require("../controllers/analytics.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

// All analytics endpoints are Party Admin only
router.use(protect, authorize("PARTY_ADMIN"));

router.get("/turnout-prediction",       getTurnoutPrediction);
router.get("/booth-health",             getBoothHealth);
router.get("/risk-analysis",            getRiskAnalysis);
router.get("/coordinator-performance",  getCoordinatorPerformance);
router.get("/election-health",          getElectionHealth);

module.exports = router;
