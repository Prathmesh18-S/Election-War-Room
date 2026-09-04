const Election = require("../models/Election");
const Booth = require("../models/Booth");
const User = require("../models/User");
const Turnout = require("../models/Turnout");
const Issue = require("../models/Issue");
const CoordinatorActivity = require("../models/CoordinatorActivity");
const { getTodayFilter } = require("../utils/date");
const { syncElectionStatuses } = require("../utils/electionSync");

const getDashboardOverview = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    await syncElectionStatuses(organizationId);

    const activeElection = await Election.findOne({
      organizationId,
      status: "ACTIVE",
    });
    const activeElectionId = activeElection ? activeElection._id : null;

    const totalElections = await Election.countDocuments({
      organizationId,
    });

    const totalBooths = activeElectionId
      ? await Booth.countDocuments({
          organizationId,
          electionId: activeElectionId,
        })
      : 0;

    const activeBooths = activeElectionId
      ? await Booth.countDocuments({
          organizationId,
          electionId: activeElectionId,
          status: "ACTIVE",
        })
      : 0;

    const totalCoordinators = activeElectionId
      ? await User.countDocuments({
          organizationId,
          role: "BOOTH_COORDINATOR",
          assignedElection: activeElectionId,
        })
      : 0;

    const totalTurnoutRecords = activeElectionId
      ? await Turnout.countDocuments({
          organizationId,
          electionId: activeElectionId,
          createdAt: getTodayFilter(),
        })
      : 0;

    const totalIssues = activeElectionId
      ? await Issue.countDocuments({
          organizationId,
          electionId: activeElectionId,
          createdAt: getTodayFilter(),
        })
      : 0;

    const openIssues = activeElectionId
      ? await Issue.countDocuments({
          organizationId,
          electionId: activeElectionId,
          status: "OPEN",
          createdAt: getTodayFilter(),
        })
      : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        totalElections,
        totalBooths,
        activeBooths,
        totalCoordinators,
        totalTurnoutRecords,
        totalIssues,
        openIssues,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTurnoutAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const activeElection = await Election.findOne({ organizationId, status: "ACTIVE" });
    const activeElectionId = activeElection ? activeElection._id : null;

    const turnoutRecords = activeElectionId
      ? await Turnout.find({
          organizationId,
          electionId: activeElectionId,
          createdAt: getTodayFilter(),
        })
      : [];

    const totalRecords = turnoutRecords.length;

    const totalVotesCast = turnoutRecords.reduce(
      (sum, record) => sum + record.totalVotesCast,
      0
    );

    const averageTurnoutPercentage =
      totalRecords > 0
        ? (
            turnoutRecords.reduce(
              (sum, record) =>
                sum + record.turnoutPercentage,
              0
            ) / totalRecords
          ).toFixed(2)
        : 0;

    const percentages = turnoutRecords.map(
      (record) => record.turnoutPercentage
    );

    const highestTurnout =
      percentages.length > 0
        ? Math.max(...percentages)
        : 0;

    const lowestTurnout =
      percentages.length > 0
        ? Math.min(...percentages)
        : 0;

    res.status(200).json({
      success: true,
      analytics: {
        totalRecords,
        totalVotesCast,
        averageTurnoutPercentage,
        highestTurnout,
        lowestTurnout,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getIssueAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const activeElection = await Election.findOne({ organizationId, status: "ACTIVE" });
    const activeElectionId = activeElection ? activeElection._id : null;

    const issues = activeElectionId
      ? await Issue.find({
          organizationId,
          electionId: activeElectionId,
          createdAt: getTodayFilter(),
        })
      : [];

    const totalIssues = issues.length;

    const openIssues = issues.filter(
      (issue) => issue.status === "OPEN"
    ).length;

    const inProgressIssues = issues.filter(
      (issue) => issue.status === "IN_PROGRESS"
    ).length;

    const resolvedIssues = issues.filter(
      (issue) => issue.status === "RESOLVED"
    ).length;

    res.status(200).json({
      success: true,
      analytics: {
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const getCoordinatorAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const activeElection = await Election.findOne({ organizationId, status: "ACTIVE" });
    const activeElectionId = activeElection ? activeElection._id : null;

    const activities = activeElectionId
      ? await CoordinatorActivity.find({
          organizationId,
          electionId: activeElectionId,
          createdAt: getTodayFilter(),
        })
      : [];

    const totalActivities = activities.length;

    const checkedInCount = activities.filter(
      (a) => a.arrivedAtBooth
    ).length;

    const pollingStartedCount = activities.filter(
      (a) => a.pollingStarted
    ).length;

    const evmWorkingCount = activities.filter(
      (a) => a.evmStatus === "WORKING"
    ).length;

    const evmIssueCount = activities.filter(
      (a) => a.evmStatus === "NOT_WORKING"
    ).length;

    res.status(200).json({
      success: true,
      analytics: {
        totalActivities,
        checkedInCount,
        pollingStartedCount,
        evmWorkingCount,
        evmIssueCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const getDashboardSummary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    await syncElectionStatuses(organizationId);

    const activeElection = await Election.findOne({
      organizationId,
      status: "ACTIVE",
    });
    const activeElectionId = activeElection ? activeElection._id : null;

    // Overview counts
    const totalElections = await Election.countDocuments({ organizationId });
    const totalBooths = activeElectionId
      ? await Booth.countDocuments({ organizationId, electionId: activeElectionId })
      : 0;
    const totalCoordinators = activeElectionId
      ? await User.countDocuments({
          organizationId,
          role: "BOOTH_COORDINATOR",
          assignedElection: activeElectionId,
        })
      : 0;

    // Turnout data (based on the latest report per booth)
    const turnoutRecords = activeElectionId
      ? await Turnout.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() })
      : [];
    const latestTurnoutMap = {};
    for (const t of turnoutRecords) {
      const key = String(t.boothId);
      if (!latestTurnoutMap[key] || new Date(t.createdAt) > new Date(latestTurnoutMap[key].createdAt)) {
        latestTurnoutMap[key] = t;
      }
    }
    const latestTurnouts = Object.values(latestTurnoutMap);
    const totalVotesCast = latestTurnouts.reduce((sum, r) => sum + r.totalVotesCast, 0);
    const averageTurnoutPercentage =
      latestTurnouts.length > 0
        ? (latestTurnouts.reduce((sum, r) => sum + r.turnoutPercentage, 0) / latestTurnouts.length).toFixed(2)
        : 0;

    // Issues data
    const issues = activeElectionId
      ? await Issue.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() })
      : [];
    const openIssues = issues.filter((i) => i.status === "OPEN").length;
    const inProgressIssues = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const resolvedIssues = issues.filter((i) => i.status === "RESOLVED").length;

    // Coordinator activities
    const activities = activeElectionId
      ? await CoordinatorActivity.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() })
      : [];
    const checkedInCount = activities.filter((a) => a.arrivedAtBooth).length;
    const pollingStartedCount = activities.filter((a) => a.pollingStarted).length;
    const evmWorkingCount = activities.filter((a) => a.evmStatus === "WORKING").length;
    const evmIssueCount = activities.filter((a) => a.evmStatus === "NOT_WORKING").length;

    // Recent Issues (latest 5)
    const recentIssues = activeElectionId
      ? await Issue.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() })
          .populate("boothId", "boothNumber constituency pollingStationName")
          .populate("reportedBy", "name mobileNumber")
          .populate("electionId", "name")
          .sort({ createdAt: -1 })
          .limit(5)
      : [];

    // Recent Activities (latest 5, filtered by current booth assignment)
    const allRecentActivities = activeElectionId
      ? await CoordinatorActivity.find({ organizationId, electionId: activeElectionId, createdAt: getTodayFilter() })
          .populate("boothId", "boothNumber constituency pollingStationName")
          .populate("coordinatorId", "name mobileNumber assignedBooth")
          .populate("electionId", "name")
          .sort({ updatedAt: -1 })
      : [];

    const recentActivities = allRecentActivities
      .filter((act) => {
        return (
          act.coordinatorId &&
          act.coordinatorId.assignedBooth &&
          String(act.coordinatorId.assignedBooth) === String(act.boothId?._id || act.boothId)
        );
      })
      .slice(0, 5);

    // Chart Data: Turnout Trend by Hour
    const hourlyTurnoutMap = {};
    turnoutRecords.forEach((r) => {
      const hr = r.reportHour;
      if (!hourlyTurnoutMap[hr]) {
        hourlyTurnoutMap[hr] = { totalPercentage: 0, count: 0 };
      }
      hourlyTurnoutMap[hr].totalPercentage += r.turnoutPercentage;
      hourlyTurnoutMap[hr].count += 1;
    });
    const turnoutTrend = Object.keys(hourlyTurnoutMap)
      .map((hour) => ({
        hour: Number(hour),
        averagePercentage: Number(
          (hourlyTurnoutMap[hour].totalPercentage / hourlyTurnoutMap[hour].count).toFixed(2)
        ),
      }))
      .sort((a, b) => a.hour - b.hour);

    // Chart Data: Issue Distribution
    const issueStatusDistribution = {
      OPEN: openIssues,
      IN_PROGRESS: inProgressIssues,
      RESOLVED: resolvedIssues,
    };

    // Chart Data: Activity Progress
    const activityProgress = {
      totalCoordinators,
      arrivedCoordinators: checkedInCount,
      pollingStarted: pollingStartedCount,
      evmWorking: evmWorkingCount,
      evmIssues: evmIssueCount,
    };

    res.status(200).json({
      success: true,
      summary: {
        overview: {
          totalElections,
          totalBooths,
          totalCoordinators,
          arrivedCoordinators: checkedInCount,
          pollingStarted: pollingStartedCount,
          openIssues,
          resolvedIssues,
          totalVotes: totalVotesCast,
          averageTurnoutPercentage,
          evmWorking: evmWorkingCount,
          evmIssues: evmIssueCount,
        },
        activities: {
          totalActivities: activities.length,
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
        recentIssues,
        recentActivities,
        charts: {
          turnoutTrend,
          issueStatusDistribution,
          activityProgress,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardOverview,
  getTurnoutAnalytics,
  getIssueAnalytics,
  getCoordinatorAnalytics,
  getDashboardSummary,
};