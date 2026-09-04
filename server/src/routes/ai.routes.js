const express = require("express");
const { getDailySummary, getDashboardInsights } = require("../controllers/ai.controller");
const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/daily-summary", protect, authorize("PARTY_ADMIN"), getDailySummary);
router.get("/war-room-summary", protect, authorize("PARTY_ADMIN"), getDailySummary);
router.get("/dashboard-insights", protect, authorize("PARTY_ADMIN"), getDashboardInsights);

module.exports = router;
