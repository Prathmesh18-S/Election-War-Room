"use strict";

const Election = require("../models/Election");
const analyticsService = require("../services/analytics.service");
const aiService = require("../services/ai.service");
const { syncElectionStatuses } = require("../utils/electionSync");

// ─────────────────────────────────────────────────────────────
// HELPER: resolve the election to analyze
// If ?electionId= is provided, use that election (for historical view).
// Otherwise, default to the currently ACTIVE election.
// ─────────────────────────────────────────────────────────────
const resolveElection = async (organizationId, queryElectionId) => {
  await syncElectionStatuses(organizationId);

  if (queryElectionId) {
    const election = await Election.findOne({
      _id: queryElectionId,
      organizationId,
    }).lean();
    return election || null;
  }

  // Default: active election
  const election = await Election.findOne({
    organizationId,
    status: "ACTIVE",
  }).lean();
  return election || null;
};

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/turnout-prediction?electionId=<id>
// ─────────────────────────────────────────────────────────────
const getTurnoutPrediction = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const election = await resolveElection(organizationId, req.query.electionId);

    if (!election) {
      return res.status(200).json({
        success: true,
        trendData: { hourlyTrend: [], currentAvgTurnout: 0, latestHour: null, totalBooths: 0, boothsReported: 0 },
        prediction: { predictedFinalTurnout: 0, confidence: "No Data", reasoning: "No active or specified election found." },
      });
    }

    // 1. Build trend data from DB (deterministic)
    const trendData = await analyticsService.computeTurnoutTrendData(organizationId, election._id, election);

    // 2. Ask Gemini to predict (with fallback)
    const prediction = await aiService.predictTurnout(trendData);

    return res.status(200).json({
      success: true,
      trendData,
      prediction,
      election: { _id: election._id, name: election.name, status: election.status },
    });
  } catch (error) {
    console.error("[getTurnoutPrediction]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/booth-health?electionId=<id>
// ─────────────────────────────────────────────────────────────
const getBoothHealth = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const election = await resolveElection(organizationId, req.query.electionId);

    if (!election) {
      return res.status(200).json({
        success: true,
        summary: { totalBooths: 0, avgHealthScore: 0, statusCounts: { Excellent: 0, Good: 0, Average: 0, Poor: 0, Critical: 0 } },
        booths: [],
        election: null,
      });
    }

    const boothHealthScores = await analyticsService.computeBoothHealthScores(organizationId, election._id, election);

    // Summary stats
    const totalBooths = boothHealthScores.length;
    const statusCounts = { Excellent: 0, Good: 0, Average: 0, Poor: 0, Critical: 0 };
    boothHealthScores.forEach((b) => {
      if (statusCounts[b.healthStatus] !== undefined) statusCounts[b.healthStatus]++;
    });
    const avgHealthScore =
      totalBooths > 0
        ? Number(
            (boothHealthScores.reduce((s, b) => s + b.healthScore, 0) / totalBooths).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      success: true,
      summary: { totalBooths, avgHealthScore, statusCounts },
      booths: boothHealthScores,
      election: { _id: election._id, name: election.name, status: election.status },
    });
  } catch (error) {
    console.error("[getBoothHealth]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/risk-analysis?electionId=<id>
// ─────────────────────────────────────────────────────────────
const getRiskAnalysis = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const election = await resolveElection(organizationId, req.query.electionId);

    if (!election) {
      return res.status(200).json({
        success: true,
        summary: { overallRisk: "LOW", riskCounts: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }, totalBooths: 0 },
        booths: [],
        election: null,
      });
    }

    const riskData = await analyticsService.computeRiskAnalysis(organizationId, election._id, election);

    // Summary counts by risk level
    const riskCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    riskData.forEach((b) => {
      if (riskCounts[b.riskLevel] !== undefined) riskCounts[b.riskLevel]++;
    });

    // Overall risk level = worst level with at least one booth
    let overallRisk = "LOW";
    if (riskCounts.CRITICAL > 0) overallRisk = "CRITICAL";
    else if (riskCounts.HIGH > 0) overallRisk = "HIGH";
    else if (riskCounts.MEDIUM > 0) overallRisk = "MEDIUM";

    return res.status(200).json({
      success: true,
      summary: { overallRisk, riskCounts, totalBooths: riskData.length },
      booths: riskData,
      election: { _id: election._id, name: election.name, status: election.status },
    });
  } catch (error) {
    console.error("[getRiskAnalysis]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/coordinator-performance?electionId=<id>
// ─────────────────────────────────────────────────────────────
const getCoordinatorPerformance = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const election = await resolveElection(organizationId, req.query.electionId);

    if (!election) {
      return res.status(200).json({
        success: true,
        summary: { total: 0, avgScore: 0, ratingCounts: { Excellent: 0, Good: 0, Average: 0, Poor: 0 } },
        coordinators: [],
        election: null,
      });
    }

    const coordinators = await analyticsService.computeCoordinatorPerformance(organizationId, election._id, election);

    const total = coordinators.length;
    const ratingCounts = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
    coordinators.forEach((c) => {
      if (ratingCounts[c.performanceRating] !== undefined) ratingCounts[c.performanceRating]++;
    });
    const avgScore =
      total > 0
        ? Number(
            (coordinators.reduce((s, c) => s + c.performanceScore, 0) / total).toFixed(1)
          )
        : 0;

    return res.status(200).json({
      success: true,
      summary: { total, avgScore, ratingCounts },
      coordinators,
      election: { _id: election._id, name: election.name, status: election.status },
    });
  } catch (error) {
    console.error("[getCoordinatorPerformance]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/analytics/election-health?electionId=<id>
// ─────────────────────────────────────────────────────────────
const getElectionHealth = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const election = await resolveElection(organizationId, req.query.electionId);

    if (!election) {
      return res.status(200).json({
        success: true,
        electionHealth: {
          healthScore: 0,
          healthStatus: "Critical",
          breakdown: { avgBoothHealth: 0, avgCoordinatorPerformance: 0, issueHealth: 0, avgTurnoutPct: 0, pollingStartedPct: 0 },
          stats: { totalBooths: 0, openIssues: 0, criticalOpenIssues: 0, coordinatorsCheckedIn: 0, pollingStarted: 0 },
        },
        election: null,
      });
    }

    const health = await analyticsService.computeElectionHealth(organizationId, election._id, election);

    return res.status(200).json({
      success: true,
      electionHealth: health,
      election: { _id: election._id, name: election.name, status: election.status },
    });
  } catch (error) {
    console.error("[getElectionHealth]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTurnoutPrediction,
  getBoothHealth,
  getRiskAnalysis,
  getCoordinatorPerformance,
  getElectionHealth,
};
