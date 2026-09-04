const Booth = require("../models/Booth");
const Turnout = require("../models/Turnout");
const Issue = require("../models/Issue");
const CoordinatorActivity = require("../models/CoordinatorActivity");
const { getTodayFilter } = require("../utils/date");

const getCoordinatorDashboard = async (req, res) => {
  try {
    const coordinatorId = req.user.id;

    // Find the booth assigned to this coordinator
    const booth = await Booth.findOne({
      assignedCoordinator: coordinatorId,
    }).populate("electionId");

    if (!booth) {
      return res.status(200).json({
        success: true,
        dashboard: {
          assignedBooth: null,
          assignedElection: null,
          todaysActivity: null,
          turnoutReportsSubmitted: 0,
          reportedIssues: 0,
          pollingStarted: false,
          evmStatus: "WORKING",
          arrivalTime: null,
          currentLocation: null,
        },
      });
    }

    // Find coordinator activity for this booth and election
    const activity = await CoordinatorActivity.findOne({
      coordinatorId,
      boothId: booth._id,
      electionId: booth.electionId?._id,
      createdAt: getTodayFilter(),
    });

    // Count of turnout reports submitted by this coordinator
    const turnoutReportsSubmitted = await Turnout.countDocuments({
      reportedBy: coordinatorId,
      boothId: booth._id,
      createdAt: getTodayFilter(),
    });

    // Count of issues reported by this coordinator
    const reportedIssues = await Issue.countDocuments({
      reportedBy: coordinatorId,
      boothId: booth._id,
      createdAt: getTodayFilter(),
    });

    res.status(200).json({
      success: true,
      dashboard: {
        assignedBooth: booth,
        assignedElection: booth.electionId,
        todaysActivity: activity || null,
        turnoutReportsSubmitted,
        reportedIssues,
        pollingStarted: activity ? activity.pollingStarted : false,
        evmStatus: activity ? activity.evmStatus : "WORKING",
        arrivalTime: activity ? activity.arrivalTime : null,
        currentLocation: activity ? activity.currentLocation : null,
        activityTimeline: activity ? activity.updateHistory : [],
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
  getCoordinatorDashboard,
};
