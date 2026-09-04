const CoordinatorActivity = require("../models/CoordinatorActivity");
const { getTodayFilter, isWithinElectionHours } = require("../utils/date");

const startActivity = async (req, res) => {
  try {
    // ── Election hours guard ──
    if (!isWithinElectionHours()) {
      return res.status(403).json({
        success: false,
        message: "Check-in is only allowed between 6:00 AM and 7:00 PM on election day.",
      });
    }

    const {
      electionId,
      boothId,
      remarks,
      currentLocation,
    } = req.body;

    const existingActivity =
      await CoordinatorActivity.findOne({
        coordinatorId: req.user.id,
        electionId,
        createdAt: getTodayFilter(),
      });

    if (existingActivity) {
      return res.status(400).json({
        success: false,
        message:
          "Activity already exists for today in this election",
      });
    }

    const now = new Date();
    const activity =
      await CoordinatorActivity.create({
        organizationId:
          req.user.organizationId,
        electionId,
        boothId,
        coordinatorId: req.user.id,

        arrivedAtBooth: true,
        arrivalTime: now,

        remarks,
        currentLocation,

        updateHistory: [
          {
            timestamp: now,
            action: "CHECK_IN",
            evmStatus: null,
            pollingStarted: null,
            remarks: remarks || "Checked in at booth",
          },
        ],
      });

    res.status(201).json({
      success: true,
      message:
        "Coordinator checked in successfully",
      activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateActivity = async (req, res) => {
  try {
    // ── Election hours guard ──
    if (!isWithinElectionHours()) {
      return res.status(403).json({
        success: false,
        message: "Activity updates are only allowed between 6:00 AM and 7:00 PM on election day.",
      });
    }

    const activity =
      await CoordinatorActivity.findOne({
        _id: req.params.id,
        organizationId: req.user.organizationId,
      });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const {
      evmStatus,
      pollingStarted,
      remarks,
      currentLocation,
    } = req.body;

    // Determine what changed for the history label
    const actions = [];
    if (evmStatus && evmStatus !== activity.evmStatus) {
      actions.push(evmStatus === "WORKING" ? "EVM_WORKING" : "EVM_NOT_WORKING");
      activity.evmStatus = evmStatus;
    }

    if (pollingStarted === true && !activity.pollingStarted) {
      actions.push("POLLING_STARTED");
      activity.pollingStarted = true;
      activity.pollingStartTime = new Date();
    }

    if (remarks && remarks !== activity.remarks) {
      actions.push("REMARKS_UPDATE");
      activity.remarks = remarks;
    }

    if (currentLocation) {
      activity.currentLocation = currentLocation;
    }

    // Push a history entry for this update
    if (actions.length > 0) {
      activity.updateHistory.push({
        timestamp: new Date(),
        action: actions.join("+"),
        evmStatus: activity.evmStatus,
        pollingStarted: activity.pollingStarted,
        remarks: remarks || activity.remarks,
      });
    }

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllActivities = async (
  req,
  res
) => {
  try {
    const activities =
      await CoordinatorActivity.find({
        organizationId:
          req.user.organizationId,
        createdAt: getTodayFilter(),
      })
        .populate(
          "coordinatorId",
          "name mobileNumber role"
        )
        .populate(
          "boothId",
          "boothNumber pollingStationName"
        )
        .populate(
          "electionId",
          "name status"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getActivityByBooth = async (
  req,
  res
) => {
  try {
    const activity =
      await CoordinatorActivity.findOne({
        boothId: req.params.boothId,
        organizationId:
          req.user.organizationId,
        createdAt: getTodayFilter(),
      })
        .populate(
          "coordinatorId",
          "name mobileNumber role"
        )
        .populate(
          "electionId",
          "name status"
        );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message:
          "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getActivityDashboard =
  async (req, res) => {
    try {
      const activities =
        await CoordinatorActivity.find({
          organizationId:
            req.user.organizationId,
          createdAt: getTodayFilter(),
        });

      const totalActivities =
        activities.length;

      const arrivedCount =
        activities.filter(
          (a) => a.arrivedAtBooth
        ).length;

      const pollingStartedCount =
        activities.filter(
          (a) => a.pollingStarted
        ).length;

      const evmWorkingCount =
        activities.filter(
          (a) =>
            a.evmStatus ===
            "WORKING"
        ).length;

      const evmIssueCount =
        activities.filter(
          (a) =>
            a.evmStatus ===
            "NOT_WORKING"
        ).length;

      res.status(200).json({
        success: true,
        dashboard: {
          totalActivities,
          arrivedCount,
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

module.exports = {
  startActivity,
  updateActivity,
  getAllActivities,
  getActivityByBooth,
  getActivityDashboard,
};