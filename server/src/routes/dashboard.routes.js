const express = require("express");

const {
  getDashboardOverview,
  getTurnoutAnalytics,
  getIssueAnalytics,
  getCoordinatorAnalytics,
  getDashboardSummary,
} = require("../controllers/dashboard.controller");

const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/overview",
  protect,
  authorize("PARTY_ADMIN"),
  getDashboardOverview
);

router.get(
  "/turnout-analytics",
  protect,
  authorize("PARTY_ADMIN"),
  getTurnoutAnalytics
);

router.get(
  "/issue-analytics",
  protect,
  authorize("PARTY_ADMIN"),
  getIssueAnalytics
);

router.get(
  "/coordinator-analytics",
  protect,
  authorize("PARTY_ADMIN"),
  getCoordinatorAnalytics
);

router.get(
  "/summary",
  protect,
  authorize("PARTY_ADMIN"),
  getDashboardSummary
);

module.exports = router;