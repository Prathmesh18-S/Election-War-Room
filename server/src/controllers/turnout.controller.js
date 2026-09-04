const Turnout = require("../models/Turnout");
const Booth = require("../models/Booth");
const Election = require("../models/Election");
const { getTodayFilter } = require("../utils/date");

const submitTurnout = async (req, res) => {
  try {
    const {
      electionId,
      boothId,
      reportHour,
      totalVotesCast,
    } = req.body;

    // ── Validate time window if role is BOOTH_COORDINATOR ──
    if (req.user.role === "BOOTH_COORDINATOR") {
      const hourNum = parseInt(reportHour, 10);
      if (isNaN(hourNum) || hourNum < 7 || hourNum > 18) {
        return res.status(400).json({
          success: false,
          message: "Turnout must be reported between 7:00 AM and 6:00 PM.",
        });
      }

      const now = new Date();
      const slotDate = new Date(now);
      slotDate.setHours(hourNum, 0, 0, 0);

      const diffMs = now - slotDate;
      if (diffMs < 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot submit turnout for a future hour.",
        });
      }
      if (diffMs > 60 * 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: "Cannot submit turnout more than 1 hour after the slot.",
        });
      }
    }

    const election = await Election.findOne({
      _id: electionId,
      organizationId: req.user.organizationId,
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    const booth = await Booth.findOne({
      _id: boothId,
      organizationId: req.user.organizationId,
    });

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    const existingTurnout = await Turnout.findOne({
      boothId,
      reportHour,
      createdAt: getTodayFilter(),
    });

    if (existingTurnout) {
      return res.status(400).json({
        success: false,
        message: "Turnout already reported for this hour today",
      });
    }

    if (totalVotesCast < 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid vote count",
  });
}
if (
  totalVotesCast >
  booth.totalRegisteredVoters
) {
  return res.status(400).json({
    success: false,
    message:
      "Votes cast cannot exceed registered voters",
  });
}


    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    const turnoutPercentage =
      (totalVotesCast /
        booth.totalRegisteredVoters) *
      100;

    const turnout = await Turnout.create({
      organizationId: req.user.organizationId,
      electionId,
      boothId,
      reportedBy: req.user.id,
      reportHour,
      totalVotesCast,
      turnoutPercentage:
        turnoutPercentage.toFixed(2),
    });

    res.status(201).json({
      success: true,
      message: "Turnout submitted successfully",
      turnout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllTurnout = async (req, res) => {
  try {
    const turnoutRecords = await Turnout.find({
      organizationId: req.user.organizationId,
      createdAt: getTodayFilter(),
    })
      .populate("boothId", "boothNumber pollingStationName")
      .populate("reportedBy", "name role")
      .populate("electionId", "name status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: turnoutRecords.length,
      turnoutRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getBoothTurnout = async (req, res) => {
  try {
    const turnoutRecords = await Turnout.find({
      boothId: req.params.boothId,
      organizationId: req.user.organizationId,
      createdAt: getTodayFilter(),
    })
      .populate("reportedBy", "name role")
      .sort({ reportHour: 1 });

    res.status(200).json({
      success: true,
      count: turnoutRecords.length,
      turnoutRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTurnout = async (req, res) => {
  try {
    const turnout = await Turnout.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!turnout) {
      return res.status(404).json({
        success: false,
        message: "Turnout record not found",
      });
    }

    if (req.body.totalVotesCast) {
      turnout.totalVotesCast =
        req.body.totalVotesCast;

      const booth = await Booth.findById(
        turnout.boothId
      );

      turnout.turnoutPercentage =
        (
          turnout.totalVotesCast /
          booth.totalRegisteredVoters
        ) * 100;
    }

    await turnout.save();

    res.status(200).json({
      success: true,
      message: "Turnout updated successfully",
      turnout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTurnoutDashboard = async (req, res) => {
  try {
    const turnoutRecords = await Turnout.find({
      organizationId: req.user.organizationId,
      createdAt: getTodayFilter(),
    });

    const totalRecords = turnoutRecords.length;

    const totalVotesCast = turnoutRecords.reduce(
      (sum, record) => sum + record.totalVotesCast,
      0
    );

    const averageTurnout =
      totalRecords > 0
        ? (
            turnoutRecords.reduce(
              (sum, record) =>
                sum + record.turnoutPercentage,
              0
            ) / totalRecords
          ).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        totalRecords,
        totalVotesCast,
        averageTurnout,
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
  submitTurnout,
  getAllTurnout,
  getBoothTurnout,
  updateTurnout,
  getTurnoutDashboard,
};