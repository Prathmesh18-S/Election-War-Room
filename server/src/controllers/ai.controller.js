const Election = require("../models/Election");
const Booth = require("../models/Booth");
const User = require("../models/User");
const Turnout = require("../models/Turnout");
const Issue = require("../models/Issue");
const CoordinatorActivity = require("../models/CoordinatorActivity");
const aiService = require("../services/ai.service");
const { getTodayFilter } = require("../utils/date");
const { syncElectionStatuses } = require("../utils/electionSync");

/**
 * Gathers and compiles all real-time daily metrics for daily summary.
 */
const getDailySummary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    await syncElectionStatuses(organizationId);

    const activeElection = await Election.findOne({ organizationId, status: "ACTIVE" });
    const activeElectionId = activeElection ? activeElection._id : null;

    // 1. Total & Active Booths
    const totalBooths = activeElectionId ? await Booth.countDocuments({ organizationId, electionId: activeElectionId }) : 0;
    const activeBooths = activeElectionId ? await Booth.countDocuments({ organizationId, electionId: activeElectionId, status: "ACTIVE" }) : 0;
    
    // 2. Polling Started (coordinator activities with pollingStarted: true)
    const pollingStarted = activeElectionId ? await CoordinatorActivity.countDocuments({ organizationId, electionId: activeElectionId, pollingStarted: true, createdAt: getTodayFilter() }) : 0;
    
    // 3. Issues data
    const openIssues = activeElectionId ? await Issue.countDocuments({ organizationId, electionId: activeElectionId, status: "OPEN", createdAt: getTodayFilter() }) : 0;
    const resolvedIssues = activeElectionId ? await Issue.countDocuments({ organizationId, electionId: activeElectionId, status: "RESOLVED", createdAt: getTodayFilter() }) : 0;
    const criticalIssues = activeElectionId ? await Issue.countDocuments({ organizationId, electionId: activeElectionId, aiPriority: "CRITICAL", status: "OPEN", createdAt: getTodayFilter() }) : 0;
    
    // 4. Turnout calculations
    const turnoutRecords = activeElectionId ? await Turnout.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() }).populate("boothId") : [];
    const totalVotes = turnoutRecords.reduce((sum, r) => sum + r.totalVotesCast, 0);
    
    const averageTurnout =
      turnoutRecords.length > 0
        ? (turnoutRecords.reduce((sum, r) => sum + r.turnoutPercentage, 0) / turnoutRecords.length).toFixed(2)
        : "0.00";
        
    // 5. Highest & Lowest Turnout Booths
    let highestTurnoutBooth = "No data reported";
    let lowestTurnoutBooth = "No data reported";
    
    if (turnoutRecords.length > 0) {
      const sorted = [...turnoutRecords].sort((a, b) => b.turnoutPercentage - a.turnoutPercentage);
      const highest = sorted[0];
      const lowest = sorted[sorted.length - 1];
      
      if (highest && highest.boothId) {
        highestTurnoutBooth = `Booth #${highest.boothId.boothNumber} (${highest.boothId.pollingStationName || 'Unknown'}) - ${highest.turnoutPercentage}%`;
      }
      if (lowest && lowest.boothId) {
        lowestTurnoutBooth = `Booth #${lowest.boothId.boothNumber} (${lowest.boothId.pollingStationName || 'Unknown'}) - ${lowest.turnoutPercentage}%`;
      }
    }
    
    // 6. Overall Election Status
    const election = await Election.findOne({ organizationId, status: "ACTIVE" });
    const overallElectionStatus = election 
      ? `${election.name} is currently ${election.status}` 
      : "No active election currently running";
    
    const dailyData = {
      totalBooths,
      activeBooths,
      pollingStarted,
      openIssues,
      resolvedIssues,
      criticalIssues,
      totalVotes,
      averageTurnout,
      highestTurnoutBooth,
      lowestTurnoutBooth,
      overallElectionStatus,
    };
    
    const summary = await aiService.generateDailySummary(dailyData);
    
    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Gathers and compiles all metrics for dashboard insights generation.
 */
const getDashboardInsights = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    const activeElection = await Election.findOne({ organizationId, status: "ACTIVE" });
    const activeElectionId = activeElection ? activeElection._id : null;

    const totalBooths = activeElectionId ? await Booth.countDocuments({ organizationId, electionId: activeElectionId }) : 0;
    const totalCoordinators = activeElectionId ? await User.countDocuments({
      organizationId,
      role: "BOOTH_COORDINATOR",
      assignedElection: activeElectionId,
    }) : 0;
    
    // Turnout records
    const turnoutRecords = activeElectionId ? await Turnout.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() }) : [];
    const totalVotesCast = turnoutRecords.reduce((sum, r) => sum + r.totalVotesCast, 0);
    const averageTurnoutPercentage =
      turnoutRecords.length > 0
        ? (turnoutRecords.reduce((sum, r) => sum + r.turnoutPercentage, 0) / turnoutRecords.length).toFixed(2)
        : 0;
        
    // Issues records
    const issues = activeElectionId ? await Issue.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() }) : [];
    const openIssues = issues.filter((i) => i.status === "OPEN").length;
    const inProgressIssues = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const resolvedIssues = issues.filter((i) => i.status === "RESOLVED").length;
    
    // Coordinator activities
    const activities = activeElectionId ? await CoordinatorActivity.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() }) : [];
    const checkedInCount = activities.filter((a) => a.arrivedAtBooth).length;
    const pollingStartedCount = activities.filter((a) => a.pollingStarted).length;
    const evmWorkingCount = activities.filter((a) => a.evmStatus === "WORKING").length;
    const evmIssueCount = activities.filter((a) => a.evmStatus === "NOT_WORKING").length;
    
    const recentIssues = activeElectionId ? await Issue.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() })
      .populate("boothId", "boothNumber constituency pollingStationName")
      .sort({ createdAt: -1 })
      .limit(5) : [];

    const compiledData = {
      activities: {
        totalCoordinators,
        arrivedCount: checkedInCount,
        pollingStartedCount,
        evmWorkingCount,
        evmIssueCount,
      },
      turnout: {
        totalVotesCast,
        averageTurnoutPercentage,
      },
      issues: {
        totalIssues: issues.length,
        openIssues,
        inProgressIssues,
        resolvedIssues,
      },
      recentIssues: recentIssues.map(i => ({
        title: i.title,
        description: i.description,
        issueType: i.issueType,
        status: i.status,
        aiPriority: i.aiPriority,
      })),
    };
    
    const insights = await aiService.generateDashboardInsights(compiledData);
    
    res.status(200).json({
      success: true,
      insights,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDailySummary,
  getWarRoomSummary: getDailySummary, // Alias for backward compatibility
  getDashboardInsights,
};
