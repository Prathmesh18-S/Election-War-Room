const Election = require("../models/Election");
const { syncElectionStatuses } = require("../utils/electionSync");

const createElection = async (req, res) => {
  try {
    const {
      name,
      type,
      startDate,
      endDate,
    } = req.body;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (
        start.getFullYear() !== end.getFullYear() ||
        start.getMonth() !== end.getMonth() ||
        start.getDate() !== end.getDate()
      ) {
        return res.status(400).json({
          success: false,
          message: "An election must be a single-day event. Start date and end date must be the same calendar day.",
        });
      }

      // Check if election is in the past or if it's today but past 7:00 PM
      const now = new Date();
      const startZero = new Date(start);
      startZero.setHours(0, 0, 0, 0);
      const nowZero = new Date(now);
      nowZero.setHours(0, 0, 0, 0);

      if (startZero < nowZero) {
        return res.status(400).json({
          success: false,
          message: "Cannot create an election for a past date.",
        });
      }

      if (startZero.getTime() === nowZero.getTime() && now.getHours() >= 19) {
        return res.status(400).json({
          success: false,
          message: "Cannot create an election for today as it is already past the 7:00 PM operating limit.",
        });
      }
    }

    const election = await Election.create({
      name,
      type,
      startDate,
      endDate,
      organizationId: req.user.organizationId,
    });

    await syncElectionStatuses(req.user.organizationId);

    res.status(201).json({
      success: true,
      message: "Election created successfully",
      election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllElections = async (req, res) => {
  try {
    await syncElectionStatuses(req.user.organizationId);

    const elections = await Election.find({
      organizationId: req.user.organizationId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: elections.length,
      elections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getElectionById = async (req, res) => {
  try {
    await syncElectionStatuses(req.user.organizationId);

    const election = await Election.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.status(200).json({
      success: true,
      election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateElection = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    let finalStartDate = startDate;
    let finalEndDate = endDate;

    if (startDate || endDate) {
      const existingElection = await Election.findOne({
        _id: req.params.id,
        organizationId: req.user.organizationId,
      });

      if (!existingElection) {
        return res.status(404).json({
          success: false,
          message: "Election not found",
        });
      }

      if (!finalStartDate) finalStartDate = existingElection.startDate;
      if (!finalEndDate) finalEndDate = existingElection.endDate;

      const start = new Date(finalStartDate);
      const end = new Date(finalEndDate);
      if (
        start.getFullYear() !== end.getFullYear() ||
        start.getMonth() !== end.getMonth() ||
        start.getDate() !== end.getDate()
      ) {
        return res.status(400).json({
          success: false,
          message: "An election must be a single-day event. Start date and end date must be the same calendar day.",
        });
      }

      // Check if election is in the past or if it's today but past 7:00 PM
      const now = new Date();
      const startZero = new Date(start);
      startZero.setHours(0, 0, 0, 0);
      const nowZero = new Date(now);
      nowZero.setHours(0, 0, 0, 0);

      if (startZero < nowZero) {
        return res.status(400).json({
          success: false,
          message: "Cannot update an election to a past date.",
        });
      }

      if (startZero.getTime() === nowZero.getTime() && now.getHours() >= 19) {
        return res.status(400).json({
          success: false,
          message: "Cannot update an election to today as it is already past the 7:00 PM operating limit.",
        });
      }
    }

    const election = await Election.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    await syncElectionStatuses(req.user.organizationId);

    // Fetch the updated document with synced status
    const updatedElection = await Election.findById(election._id);

    res.status(200).json({
      success: true,
      message: "Election updated successfully",
      election: updatedElection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateElectionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const election = await Election.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId,
      },
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    await syncElectionStatuses(req.user.organizationId);

    const updatedElection = await Election.findById(election._id);

    res.status(200).json({
      success: true,
      message: "Election status updated successfully",
      election: updatedElection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  updateElectionStatus,
};