"use strict";

const Booth = require("../models/Booth");
const CoordinatorActivity = require("../models/CoordinatorActivity");
const Turnout = require("../models/Turnout");
const Issue = require("../models/Issue");
const User = require("../models/User");
const Election = require("../models/Election");

const { getTodayFilter, getElectionDateFilter } = require("../utils/date");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Map a 0-100 score to a human-readable status label.
 * @param {number} score
 * @param {string[][]} thresholds - [[minScore, label], ...] descending
 */
const scoreToStatus = (score, thresholds) => {
  for (const [min, label] of thresholds) {
    if (score >= min) return label;
  }
  return thresholds[thresholds.length - 1][1];
};

const BOOTH_STATUS_THRESHOLDS = [
  [80, "Excellent"],
  [60, "Good"],
  [40, "Average"],
  [20, "Poor"],
  [0,  "Critical"],
];

const COORD_RATING_THRESHOLDS = [
  [80, "Excellent"],
  [60, "Good"],
  [40, "Average"],
  [0,  "Poor"],
];

const ELECTION_STATUS_THRESHOLDS = [
  [80, "Excellent"],
  [60, "Stable"],
  [40, "Needs Attention"],
  [0,  "Critical"],
];

/**
 * Build the date filter for a given election.
 * - Active election  → filter to today's records
 * - Other elections  → filter to records on the election's own startDate
 * @param {object} election  - Election document with .status and .startDate
 */
const buildDateFilter = (election) => {
  if (election && election.status === "ACTIVE") {
    return getTodayFilter();
  }
  if (election && election.startDate) {
    return getElectionDateFilter(election.startDate);
  }
  return getTodayFilter();
};

// ─────────────────────────────────────────────────────────────
// 1. BOOTH HEALTH SCORES
// ─────────────────────────────────────────────────────────────

/**
 * Compute a health score (0–100) for every booth in the specified election.
 *
 * Scoring rubric:
 *   +20  Coordinator checked in (arrivedAtBooth)
 *   +20  Polling started
 *   +25  EVM working
 *   +15  Turnout ≥ 50 %  |  +8 Turnout 20–49 %  |  +0 < 20 %
 *   +20  No open issues
 *   −10  per open issue  (max deduction −20)
 *
 * @param {string|ObjectId} organizationId
 * @param {string|ObjectId} electionId
 * @param {object}          election       - full election document (for date filter)
 * @returns {Promise<Array>}
 */
const computeBoothHealthScores = async (organizationId, electionId, election) => {
  if (!electionId) return [];

  const dateFilter = buildDateFilter(election);

  const [booths, activities, turnoutRecords, issues] = await Promise.all([
    Booth.find({ organizationId, electionId })
      .populate("assignedCoordinator", "name")
      .lean(),
    CoordinatorActivity.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
    Turnout.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
    Issue.find({ organizationId, electionId, status: { $ne: "RESOLVED" }, createdAt: dateFilter }).lean(),
  ]);

  // Index by boothId for O(1) lookup
  const activityByBooth = {};
  activities.forEach((a) => {
    activityByBooth[String(a.boothId)] = a;
  });

  // Latest turnout % per booth (average across all hours)
  const turnoutByBooth = {};
  turnoutRecords.forEach((t) => {
    const key = String(t.boothId);
    if (!turnoutByBooth[key]) turnoutByBooth[key] = { total: 0, count: 0 };
    turnoutByBooth[key].total += t.turnoutPercentage || 0;
    turnoutByBooth[key].count += 1;
  });

  // Open issue count per booth
  const issuesByBooth = {};
  issues.forEach((i) => {
    const key = String(i.boothId);
    issuesByBooth[key] = (issuesByBooth[key] || 0) + 1;
  });

  const results = booths.map((booth) => {
    const boothKey = String(booth._id);
    const activity = activityByBooth[boothKey] || null;
    const turnoutEntry = turnoutByBooth[boothKey];
    const avgTurnout = turnoutEntry
      ? turnoutEntry.total / turnoutEntry.count
      : 0;
    const openIssueCount = issuesByBooth[boothKey] || 0;

    let score = 0;

    // Coordinator check-in
    if (activity?.arrivedAtBooth) score += 20;

    // Polling started
    if (activity?.pollingStarted) score += 20;

    // EVM status
    if (activity?.evmStatus === "WORKING") score += 25;

    // Turnout contribution
    if (avgTurnout >= 50) score += 15;
    else if (avgTurnout >= 20) score += 8;

    // Issue deduction (−10 per open issue, max −20)
    const deduction = Math.min(openIssueCount * 10, 20);
    score -= deduction;

    // Base: 20 pts if there are zero issues
    if (openIssueCount === 0) score += 20;

    score = Math.max(0, Math.min(100, score));

    return {
      boothId: booth._id,
      boothNumber: booth.boothNumber,
      pollingStationName: booth.pollingStationName,
      constituency: booth.constituency,
      district: booth.district,
      assignedCoordinator: booth.assignedCoordinator,
      healthScore: score,
      healthStatus: scoreToStatus(score, BOOTH_STATUS_THRESHOLDS),
      details: {
        coordinatorCheckedIn: activity?.arrivedAtBooth || false,
        pollingStarted: activity?.pollingStarted || false,
        evmWorking: activity?.evmStatus === "WORKING",
        avgTurnoutPct: Number(avgTurnout.toFixed(1)),
        openIssues: openIssueCount,
      },
    };
  });

  // Sort descending by healthScore
  results.sort((a, b) => b.healthScore - a.healthScore);
  return results;
};

// ─────────────────────────────────────────────────────────────
// 2. COORDINATOR PERFORMANCE SCORES
// ─────────────────────────────────────────────────────────────

/**
 * Compute a performance score (0–100) for every booth coordinator in the election.
 *
 * Scoring rubric:
 *   +20  Arrived at booth
 *   +10  Arrived by 7:30 AM (early arrival bonus)
 *   +20  Polling started
 *   +15  EVM working
 *   +15  Has remarks / activity updates
 *   +20  Submitted turnout data
 *
 * @param {string|ObjectId} organizationId
 * @param {string|ObjectId} electionId
 * @param {object}          election
 * @returns {Promise<Array>}
 */
const computeCoordinatorPerformance = async (organizationId, electionId, election) => {
  if (!electionId) return [];

  const dateFilter = buildDateFilter(election);

  const [activities, turnoutRecords] = await Promise.all([
    CoordinatorActivity.find({ organizationId, electionId, createdAt: dateFilter })
      .populate("coordinatorId", "name mobileNumber assignedBooth")
      .populate("boothId", "boothNumber pollingStationName constituency")
      .lean(),
    Turnout.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
  ]);

  // Set of boothIds that have at least one turnout submission
  const boothsWithTurnout = new Set(
    turnoutRecords.map((t) => String(t.boothId))
  );

  const results = activities
    .filter((activity) => {
      return (
        activity.coordinatorId &&
        activity.coordinatorId.assignedBooth &&
        String(activity.coordinatorId.assignedBooth) === String(activity.boothId?._id || activity.boothId)
      );
    })
    .map((activity) => {
    let score = 0;
    const flags = [];

    // Arrived
    if (activity.arrivedAtBooth) {
      score += 20;
      flags.push("Checked In");
    }

    // Early arrival (before 07:30)
    if (activity.arrivalTime) {
      const arrival = new Date(activity.arrivalTime);
      const cutoff = new Date(arrival);
      cutoff.setHours(7, 30, 0, 0);
      if (arrival <= cutoff) {
        score += 10;
        flags.push("Early Arrival");
      }
    }

    // Polling started
    if (activity.pollingStarted) {
      score += 20;
      flags.push("Polling Started");
    }

    // EVM working
    if (activity.evmStatus === "WORKING") {
      score += 15;
      flags.push("EVM OK");
    }

    // Has remarks
    if (activity.remarks && activity.remarks.trim().length > 0) {
      score += 15;
      flags.push("Active Updates");
    }

    // Submitted turnout
    if (boothsWithTurnout.has(String(activity.boothId?._id || activity.boothId))) {
      score += 20;
      flags.push("Turnout Submitted");
    }

    score = Math.max(0, Math.min(100, score));

    return {
      coordinatorId: activity.coordinatorId?._id,
      coordinatorName: activity.coordinatorId?.name || "Unknown",
      coordinatorPhone: activity.coordinatorId?.mobileNumber || "",
      boothId: activity.boothId?._id,
      boothNumber: activity.boothId?.boothNumber || "—",
      pollingStationName: activity.boothId?.pollingStationName || "—",
      constituency: activity.boothId?.constituency || "—",
      performanceScore: score,
      performanceRating: scoreToStatus(score, COORD_RATING_THRESHOLDS),
      flags,
    };
  });

  // Sort descending by score (leaderboard order)
  results.sort((a, b) => b.performanceScore - a.performanceScore);
  return results;
};

// ─────────────────────────────────────────────────────────────
// 3. RISK ANALYSIS
// ─────────────────────────────────────────────────────────────

/**
 * Evaluate risk level for every booth in the election.
 *
 * Risk flags:
 *   - 2+ open issues                   → HIGH risk
 *   - EVM NOT_WORKING                  → HIGH risk
 *   - Coordinator arrived but no polling after 1 hr → MEDIUM risk
 *   - Coordinator not checked in       → MEDIUM risk
 *   - Turnout < 15 %                   → MEDIUM risk
 *   - Turnout < 5 %                    → HIGH risk (overrides above)
 *   - Critical open issue (aiPriority=CRITICAL) → CRITICAL risk
 *
 * Risk level = worst single flag level or aggregate:
 *   0 flags = LOW, 1 = MEDIUM, 2 = HIGH, 3+ or CRITICAL flag = CRITICAL
 *
 * @param {string|ObjectId} organizationId
 * @param {string|ObjectId} electionId
 * @param {object}          election
 * @returns {Promise<Array>}
 */
const computeRiskAnalysis = async (organizationId, electionId, election) => {
  if (!electionId) return [];

  const dateFilter = buildDateFilter(election);

  const [booths, activities, turnoutRecords, issues] = await Promise.all([
    Booth.find({ organizationId, electionId }).lean(),
    CoordinatorActivity.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
    Turnout.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
    Issue.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
  ]);

  const activityByBooth = {};
  activities.forEach((a) => {
    activityByBooth[String(a.boothId)] = a;
  });

  const turnoutByBooth = {};
  turnoutRecords.forEach((t) => {
    const key = String(t.boothId);
    if (!turnoutByBooth[key]) turnoutByBooth[key] = { total: 0, count: 0 };
    turnoutByBooth[key].total += t.turnoutPercentage || 0;
    turnoutByBooth[key].count += 1;
  });

  // Group issues by booth
  const issuesByBooth = {};
  issues.forEach((i) => {
    const key = String(i.boothId);
    if (!issuesByBooth[key]) issuesByBooth[key] = [];
    issuesByBooth[key].push(i);
  });

  const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const results = booths.map((booth) => {
    const boothKey = String(booth._id);
    const activity = activityByBooth[boothKey] || null;
    const turnoutEntry = turnoutByBooth[boothKey];
    const avgTurnout = turnoutEntry
      ? turnoutEntry.total / turnoutEntry.count
      : null;
    const boothIssues = issuesByBooth[boothKey] || [];
    const openIssues = boothIssues.filter((i) => i.status !== "RESOLVED");
    const criticalIssues = boothIssues.filter(
      (i) => i.aiPriority === "CRITICAL" && i.status !== "RESOLVED"
    );

    const riskFlags = [];
    let maxRiskIndex = 0; // index into RISK_LEVELS

    const flag = (message, level) => {
      riskFlags.push({ message, level });
      const idx = RISK_LEVELS.indexOf(level);
      if (idx > maxRiskIndex) maxRiskIndex = idx;
    };

    // Critical AI-flagged issue
    if (criticalIssues.length > 0) {
      flag(`${criticalIssues.length} critical issue(s) unresolved`, "CRITICAL");
    }

    // EVM failure
    if (activity?.evmStatus === "NOT_WORKING") {
      flag("EVM reported as NOT WORKING", "HIGH");
    }

    // Multiple open issues
    if (openIssues.length >= 2) {
      flag(`${openIssues.length} unresolved issues`, "HIGH");
    } else if (openIssues.length === 1) {
      flag("1 unresolved issue", "MEDIUM");
    }

    // Coordinator not checked in
    if (!activity || !activity.arrivedAtBooth) {
      flag("Coordinator has not checked in", "MEDIUM");
    } else if (!activity.pollingStarted) {
      // Coordinator checked in but polling not started
      flag("Coordinator checked in but polling not started", "MEDIUM");
    }

    // Very low turnout
    if (avgTurnout !== null) {
      if (avgTurnout < 5) {
        flag(`Critically low turnout: ${avgTurnout.toFixed(1)}%`, "HIGH");
      } else if (avgTurnout < 15) {
        flag(`Low turnout: ${avgTurnout.toFixed(1)}%`, "MEDIUM");
      }
    } else {
      flag("No turnout data submitted", "MEDIUM");
    }

    const riskLevel = RISK_LEVELS[maxRiskIndex];
    const primaryReason =
      riskFlags.length > 0
        ? riskFlags.find((f) => f.level === riskLevel)?.message ||
          riskFlags[0].message
        : "No issues detected";

    return {
      boothId: booth._id,
      boothNumber: booth.boothNumber,
      pollingStationName: booth.pollingStationName,
      constituency: booth.constituency,
      riskLevel,
      primaryReason,
      riskFlags,
      metrics: {
        openIssues: openIssues.length,
        criticalIssues: criticalIssues.length,
        evmStatus: activity?.evmStatus || "UNKNOWN",
        coordinatorCheckedIn: activity?.arrivedAtBooth || false,
        pollingStarted: activity?.pollingStarted || false,
        avgTurnoutPct: avgTurnout !== null ? Number(avgTurnout.toFixed(1)) : null,
      },
    };
  });

  // Sort: CRITICAL → HIGH → MEDIUM → LOW
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  results.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  return results;
};

// ─────────────────────────────────────────────────────────────
// 4. TURNOUT TREND DATA (input for AI prediction)
// ─────────────────────────────────────────────────────────────

/**
 * Build hourly turnout trend data for use by the AI prediction prompt.
 *
 * @param {string|ObjectId} organizationId
 * @param {string|ObjectId} electionId
 * @param {object}          election
 * @returns {Promise<object>}
 */
const computeTurnoutTrendData = async (organizationId, electionId, election) => {
  if (!electionId) {
    return { hourlyTrend: [], currentAvgTurnout: 0, latestHour: null, totalBooths: 0, boothsReported: 0 };
  }

  const dateFilter = buildDateFilter(election);

  const [turnoutRecords, booths] = await Promise.all([
    Turnout.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
    Booth.find({ organizationId, electionId }).lean(),
  ]);

  const totalBooths = booths.length;

  // Group by reportHour → avg across all booths
  const hourlyMap = {};
  turnoutRecords.forEach((t) => {
    const hr = Number(t.reportHour);
    if (!hourlyMap[hr]) hourlyMap[hr] = { total: 0, count: 0 };
    hourlyMap[hr].total += t.turnoutPercentage || 0;
    hourlyMap[hr].count += 1;
  });

  const hourlyTrend = Object.keys(hourlyMap)
    .map((h) => ({
      hour: Number(h),
      avgTurnoutPct: Number(
        (hourlyMap[h].total / hourlyMap[h].count).toFixed(2)
      ),
      boothsReported: hourlyMap[h].count,
    }))
    .sort((a, b) => a.hour - b.hour);

  // Current overall average turnout (based on the latest report per booth)
  const latestTurnoutMap = {};
  for (const t of turnoutRecords) {
    const key = String(t.boothId);
    if (!latestTurnoutMap[key] || new Date(t.createdAt) > new Date(latestTurnoutMap[key].createdAt)) {
      latestTurnoutMap[key] = t;
    }
  }
  const latestPercentages = Object.values(latestTurnoutMap).map((t) => t.turnoutPercentage || 0);
  const currentAvgTurnout =
    latestPercentages.length > 0
      ? Number(
          (latestPercentages.reduce((s, v) => s + v, 0) / latestPercentages.length).toFixed(2)
        )
      : 0;

  // Latest reported hour
  const latestHour =
    hourlyTrend.length > 0
      ? hourlyTrend[hourlyTrend.length - 1].hour
      : null;

  return {
    hourlyTrend,
    currentAvgTurnout,
    latestHour,
    totalBooths,
    boothsReported: new Set(turnoutRecords.map((t) => String(t.boothId))).size,
  };
};

// ─────────────────────────────────────────────────────────────
// 5. ELECTION HEALTH SCORE
// ─────────────────────────────────────────────────────────────

/**
 * Compute one composite Election Health Score (0–100) from all sub-scores.
 *
 * Weights:
 *   30%  Average booth health score
 *   20%  Average coordinator performance score
 *   20%  Issue health  = 100 − (openIssues / totalBooths * 100), min 0
 *   20%  Average turnout %
 *   10%  Polling started % across booths
 *
 * @param {string|ObjectId} organizationId
 * @param {string|ObjectId} electionId
 * @param {object}          election
 * @returns {Promise<object>}
 */
const computeElectionHealth = async (organizationId, electionId, election) => {
  if (!electionId) {
    return {
      healthScore: 0,
      healthStatus: "Critical",
      breakdown: { avgBoothHealth: 0, avgCoordinatorPerformance: 0, issueHealth: 0, avgTurnoutPct: 0, pollingStartedPct: 0 },
      stats: { totalBooths: 0, openIssues: 0, criticalOpenIssues: 0, coordinatorsCheckedIn: 0, pollingStarted: 0 },
    };
  }

  const dateFilter = buildDateFilter(election);

  const [boothHealthScores, coordinatorScores, issues, activities, turnoutRecords, booths] =
    await Promise.all([
      computeBoothHealthScores(organizationId, electionId, election),
      computeCoordinatorPerformance(organizationId, electionId, election),
      Issue.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
      CoordinatorActivity.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
      Turnout.find({ organizationId, electionId, createdAt: dateFilter }).lean(),
      Booth.find({ organizationId, electionId }).lean(),
    ]);

  const totalBooths = booths.length;

  // Avg booth health
  const avgBoothHealth =
    boothHealthScores.length > 0
      ? boothHealthScores.reduce((s, b) => s + b.healthScore, 0) /
        boothHealthScores.length
      : 0;

  // Avg coordinator performance
  const avgCoordPerf =
    coordinatorScores.length > 0
      ? coordinatorScores.reduce((s, c) => s + c.performanceScore, 0) /
        coordinatorScores.length
      : 0;

  // Issue health (penalise open issues)
  const openIssues = issues.filter((i) => i.status !== "RESOLVED").length;
  const criticalOpenIssues = issues.filter(
    (i) => i.status !== "RESOLVED" && i.aiPriority === "CRITICAL"
  ).length;
  const issueHealthRaw =
    totalBooths > 0 ? 100 - (openIssues / totalBooths) * 100 : 100;
  // Extra critical penalty: −5 per critical open issue
  const issueHealth = Math.max(
    0,
    Math.min(100, issueHealthRaw - criticalOpenIssues * 5)
  );

  // Avg turnout (based on the latest report per booth)
  const healthTurnoutMap = {};
  for (const t of turnoutRecords) {
    const key = String(t.boothId);
    if (!healthTurnoutMap[key] || new Date(t.createdAt) > new Date(healthTurnoutMap[key].createdAt)) {
      healthTurnoutMap[key] = t;
    }
  }
  const latestPercentages = Object.values(healthTurnoutMap).map((t) => t.turnoutPercentage || 0);
  const avgTurnout =
    latestPercentages.length > 0
      ? latestPercentages.reduce((s, v) => s + v, 0) / latestPercentages.length
      : 0;

  // Polling started %
  const pollingStartedCount = activities.filter((a) => a.pollingStarted).length;
  const pollingPct =
    totalBooths > 0 ? (pollingStartedCount / totalBooths) * 100 : 0;

  // Weighted composite
  const healthScore = Math.round(
    avgBoothHealth * 0.30 +
    avgCoordPerf  * 0.20 +
    issueHealth   * 0.20 +
    avgTurnout    * 0.20 +
    pollingPct    * 0.10
  );

  const clampedScore = Math.max(0, Math.min(100, healthScore));

  return {
    healthScore: clampedScore,
    healthStatus: scoreToStatus(clampedScore, ELECTION_STATUS_THRESHOLDS),
    breakdown: {
      avgBoothHealth: Number(avgBoothHealth.toFixed(1)),
      avgCoordinatorPerformance: Number(avgCoordPerf.toFixed(1)),
      issueHealth: Number(issueHealth.toFixed(1)),
      avgTurnoutPct: Number(avgTurnout.toFixed(1)),
      pollingStartedPct: Number(pollingPct.toFixed(1)),
    },
    stats: {
      totalBooths,
      openIssues,
      criticalOpenIssues,
      coordinatorsCheckedIn: activities.filter((a) => a.arrivedAtBooth).length,
      pollingStarted: pollingStartedCount,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  computeBoothHealthScores,
  computeCoordinatorPerformance,
  computeRiskAnalysis,
  computeTurnoutTrendData,
  computeElectionHealth,
};
