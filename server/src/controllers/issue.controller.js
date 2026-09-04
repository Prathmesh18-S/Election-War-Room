const Issue = require("../models/Issue");
const Election = require("../models/Election");
const Booth = require("../models/Booth");
const { analyzeIssue } = require("../services/ai.service");
const { getTodayFilter, isWithinElectionHours } = require("../utils/date");

// ─────────────────────────────────────────────
// POST /api/issues  — Create a new issue
// Strategy: AWAIT the AI analysis before returning
// so the response already includes aiPriority / aiSummary /
// aiSuggestedResolution. This eliminates the "Analyzing…" flicker.
// ─────────────────────────────────────────────
const createIssue = async (req, res) => {
  try {
    // ── Election hours guard ──
    if (!isWithinElectionHours()) {
      return res.status(403).json({
        success: false,
        message: "Issues can only be reported between 6:00 AM and 7:00 PM on election day.",
      });
    }

    const { electionId, boothId, issueType, title, description } = req.body;

    console.log(`[createIssue] New issue request — type: ${issueType}, title: "${title}"`);

    // ── Validate election ──
    const election = await Election.findOne({
      _id: electionId,
      organizationId: req.user.organizationId,
    });
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found" });
    }

    // ── Validate booth ──
    const booth = await Booth.findOne({
      _id: boothId,
      organizationId: req.user.organizationId,
    });
    if (!booth) {
      return res.status(404).json({ success: false, message: "Booth not found" });
    }

    // ── Create the base issue document ──
    const issue = await Issue.create({
      organizationId: req.user.organizationId,
      electionId,
      boothId,
      reportedBy: req.user.id,
      issueType,
      title,
      description,
    });
    console.log(`[createIssue] Issue created in MongoDB: ${issue._id}`);

    // ── Run AI analysis (awaited so fields are available immediately) ──
    let aiResult = null;
    try {
      console.log(`[createIssue] Starting AI analysis for issue ${issue._id}...`);
      aiResult = await analyzeIssue(title, description, issueType);
      console.log(`[createIssue] AI analysis complete — priority: ${aiResult ? aiResult.aiPriority : "null"}`);
    } catch (aiErr) {
      // Log but don't fail — fallback is handled inside analyzeIssue, so this
      // block should rarely fire. If it does, issue is still saved.
      console.error(`[createIssue] Unexpected AI error for issue ${issue._id}:`, aiErr.message);
    }

    // ── Write AI fields back to MongoDB ──
    if (aiResult) {
      try {
        await Issue.findByIdAndUpdate(
          issue._id,
          {
            aiPriority: aiResult.aiPriority,
            aiSummary: aiResult.aiSummary,
            aiSuggestedResolution: aiResult.aiSuggestedResolution,
          },
          { new: true }
        );

        // Mutate the in-memory object so the response already has AI fields
        issue.aiPriority = aiResult.aiPriority;
        issue.aiSummary = aiResult.aiSummary;
        issue.aiSuggestedResolution = aiResult.aiSuggestedResolution;

        console.log(`[createIssue] ✅ AI fields saved to MongoDB for issue ${issue._id}`);
      } catch (updateErr) {
        console.error(`[createIssue] ❌ Failed to save AI fields to MongoDB for issue ${issue._id}:`, updateErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Issue reported successfully",
      issue,
    });

  } catch (error) {
    console.error("[createIssue] Unhandled error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/issues/:id/retry-ai
// Re-runs AI analysis for a single issue (useful for old null-field issues)
// ─────────────────────────────────────────────
const retryAiAnalysis = async (req, res) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    console.log(`[retryAiAnalysis] Re-analyzing issue ${issue._id} — "${issue.title}"`);

    const aiResult = await analyzeIssue(issue.title, issue.description, issue.issueType);

    if (!aiResult) {
      return res.status(500).json({ success: false, message: "AI analysis returned no result" });
    }

    const updated = await Issue.findByIdAndUpdate(
      issue._id,
      {
        aiPriority: aiResult.aiPriority,
        aiSummary: aiResult.aiSummary,
        aiSuggestedResolution: aiResult.aiSuggestedResolution,
      },
      { new: true, returnDocument: "after" }
    )
      .populate("reportedBy", "name role")
      .populate("boothId", "boothNumber pollingStationName")
      .populate("electionId", "name status");

    console.log(`[retryAiAnalysis] ✅ AI fields updated for issue ${issue._id} — priority: ${aiResult.aiPriority}`);

    return res.status(200).json({
      success: true,
      message: "AI analysis completed",
      issue: updated,
    });

  } catch (error) {
    console.error("[retryAiAnalysis] Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/issues/retry-ai-all
// Re-runs AI analysis for ALL issues that still have null aiPriority
// ─────────────────────────────────────────────
const retryAiAnalysisAll = async (req, res) => {
  try {
    const pendingIssues = await Issue.find({
      organizationId: req.user.organizationId,
      aiPriority: null,
    });

    console.log(`[retryAiAnalysisAll] Found ${pendingIssues.length} issues with null AI fields.`);

    if (pendingIssues.length === 0) {
      return res.status(200).json({ success: true, message: "All issues already analyzed", updated: 0 });
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (const issue of pendingIssues) {
      try {
        console.log(`[retryAiAnalysisAll] Analyzing issue ${issue._id} — "${issue.title}"`);
        const aiResult = await analyzeIssue(issue.title, issue.description, issue.issueType);
        if (aiResult) {
          await Issue.findByIdAndUpdate(issue._id, {
            aiPriority: aiResult.aiPriority,
            aiSummary: aiResult.aiSummary,
            aiSuggestedResolution: aiResult.aiSuggestedResolution,
          });
          console.log(`[retryAiAnalysisAll] ✅ Issue ${issue._id} updated — priority: ${aiResult.aiPriority}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`[retryAiAnalysisAll] ❌ Failed for issue ${issue._id}:`, err.message);
        failedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `AI analysis complete. ${updatedCount} updated, ${failedCount} failed.`,
      updated: updatedCount,
      failed: failedCount,
    });

  } catch (error) {
    console.error("[retryAiAnalysisAll] Unhandled error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/issues
// ─────────────────────────────────────────────
const getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      organizationId: req.user.organizationId,
      createdAt: getTodayFilter(),
    })
      .populate("reportedBy", "name role")
      .populate("boothId", "boothNumber pollingStationName")
      .populate("electionId", "name status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: issues.length, issues });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/issues/:id
// ─────────────────────────────────────────────
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    })
      .populate("reportedBy", "name role")
      .populate("boothId", "boothNumber pollingStationName")
      .populate("electionId", "name status")
      .populate("resolvedBy", "name role");

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    return res.status(200).json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/issues/:id/status
// ─────────────────────────────────────────────
const updateIssueStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;

    const issue = await Issue.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    issue.status = status;
    if (status === "RESOLVED") {
      issue.resolutionNote = resolutionNote || null;
      issue.resolvedBy = req.user.id;
      issue.resolvedAt = new Date();
    }

    await issue.save();

    return res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/issues/dashboard
// ─────────────────────────────────────────────
const getIssueDashboard = async (req, res) => {
  try {
    const issues = await Issue.find({
      organizationId: req.user.organizationId,
      createdAt: getTodayFilter(),
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        totalIssues: issues.length,
        openIssues: issues.filter((i) => i.status === "OPEN").length,
        inProgressIssues: issues.filter((i) => i.status === "IN_PROGRESS").length,
        resolvedIssues: issues.filter((i) => i.status === "RESOLVED").length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  getIssueDashboard,
  retryAiAnalysis,
  retryAiAnalysisAll,
};