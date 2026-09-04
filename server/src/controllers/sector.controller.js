const Booth = require("../models/Booth");
const User = require("../models/User");
const Turnout = require("../models/Turnout");
const Issue = require("../models/Issue");
const CoordinatorActivity = require("../models/CoordinatorActivity");
const { getTodayFilter } = require("../utils/date");

const getSectorDashboard = async (req, res) => {
  try {
    const sectorOfficerId = req.user.id;

    // Find all booths supervised by this sector officer
    const supervisedBooths = await Booth.find({
      assignedSectorOfficer: sectorOfficerId,
    }).populate("assignedCoordinator", "name mobileNumber isActive");

    const boothIds = supervisedBooths.map((b) => b._id);
    const coordinatorIds = supervisedBooths
      .map((b) => b.assignedCoordinator?._id)
      .filter(Boolean);

    // Active coordinators count (users active)
    const activeCoordinatorsCount = await User.countDocuments({
      _id: { $in: coordinatorIds },
      isActive: true,
    });

    // Polling started count
    const pollingStartedCount = await CoordinatorActivity.countDocuments({
      boothId: { $in: boothIds },
      pollingStarted: true,
      createdAt: getTodayFilter(),
    });

    // Open issues count
    const openIssuesCount = await Issue.countDocuments({
      boothId: { $in: boothIds },
      status: "OPEN",
      createdAt: getTodayFilter(),
    });

    // Turnout records for supervised booths
    const turnoutRecords = await Turnout.find({
      boothId: { $in: boothIds },
      createdAt: getTodayFilter(),
    });

    const totalVotes = turnoutRecords.reduce((sum, r) => sum + r.totalVotesCast, 0);
    const averageTurnout =
      turnoutRecords.length > 0
        ? (turnoutRecords.reduce((sum, r) => sum + r.turnoutPercentage, 0) / turnoutRecords.length).toFixed(2)
        : 0;

    // All coordinator activities for today (all booths, full history)
    const recentActivities = await CoordinatorActivity.find({
      boothId: { $in: boothIds },
      createdAt: getTodayFilter(),
    })
      .populate("coordinatorId", "name mobileNumber")
      .populate("boothId", "boothNumber pollingStationName constituency")
      .sort({ updatedAt: -1 })
      .limit(20);

    // Recent Turnout (latest 5)
    const recentTurnout = await Turnout.find({
      boothId: { $in: boothIds },
      createdAt: getTodayFilter(),
    })
      .populate("reportedBy", "name")
      .populate("boothId", "boothNumber constituency")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent Issues (latest 5)
    const recentIssues = await Issue.find({
      boothId: { $in: boothIds },
      createdAt: getTodayFilter(),
    })
      .populate("reportedBy", "name mobileNumber")
      .populate("boothId", "boothNumber constituency")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      dashboard: {
        assignedBooths: supervisedBooths,
        activeCoordinators: activeCoordinatorsCount,
        pollingStarted: pollingStartedCount,
        openIssues: openIssuesCount,
        totalVotes,
        averageTurnout,
        recentActivities,
        recentTurnout,
        recentIssues,
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
  getSectorDashboard,
};
