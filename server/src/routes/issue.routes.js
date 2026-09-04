const express = require("express");
const {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  getIssueDashboard,
  retryAiAnalysis,
  retryAiAnalysisAll,
} = require("../controllers/issue.controller");

const { protect, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

// ── Create a new issue (Booth Coordinator only) ──
router.post(
  "/",
  protect,
  authorize("BOOTH_COORDINATOR"),
  createIssue
);

// ── Get all issues (Party Admin, Sector Officer) ──
router.get(
  "/",
  protect,
  authorize("PARTY_ADMIN", "SECTOR_OFFICER"),
  getAllIssues
);

// ── Issue dashboard stats ──
router.get(
  "/dashboard",
  protect,
  authorize("PARTY_ADMIN"),
  getIssueDashboard
);

// ── Re-run AI on ALL issues with null aiPriority ──
// NOTE: must be before /:id routes to avoid "all" being treated as an ObjectId
router.post(
  "/retry-ai-all",
  protect,
  authorize("PARTY_ADMIN"),
  retryAiAnalysisAll
);

// ── Get single issue by ID ──
router.get(
  "/:id",
  protect,
  authorize("PARTY_ADMIN", "SECTOR_OFFICER"),
  getIssueById
);

// ── Update issue status ──
router.patch(
  "/:id/status",
  protect,
  authorize("PARTY_ADMIN"),
  updateIssueStatus
);

// ── Re-run AI on a single issue ──
router.post(
  "/:id/retry-ai",
  protect,
  authorize("PARTY_ADMIN"),
  retryAiAnalysis
);

module.exports = router;