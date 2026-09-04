const Booth = require("../models/Booth");
const User = require("../models/User");

const createBooth = async (req, res) => {
  try {
    const {
      boothNumber,
      electionId,
      state,
      district,
      constituency,
      pollingStationName,
      totalRegisteredVoters,
    } = req.body;

    const booth = await Booth.create({
      boothNumber,
      electionId,
      state,
      district,
      constituency,
      pollingStationName,
      totalRegisteredVoters,
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      success: true,
      message: "Booth created successfully",
      booth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllBooths = async (req, res) => {
  try {
    const booths = await Booth.find({
      organizationId: req.user.organizationId,
    })
      .populate("assignedCoordinator", "name mobileNumber")
      .populate("assignedSectorOfficer", "name mobileNumber")
      .populate("electionId", "name type status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: booths.length,
      booths,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



const getBoothById = async (req, res) => {
  try {
    const booth = await Booth.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    })
      .populate("assignedCoordinator", "name mobileNumber")
      .populate("assignedSectorOfficer", "name mobileNumber")
      .populate("electionId", "name type status");

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    res.status(200).json({
      success: true,
      booth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateBooth = async (req, res) => {
  try {
    const booth = await Booth.findOneAndUpdate(
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

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booth updated successfully",
      booth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const assignCoordinator = async (req, res) => {
  try {
    const { coordinatorId } = req.body;
    const coordinator = await User.findOne({
      _id: coordinatorId,
      organizationId: req.user.organizationId,
    });

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: "Coordinator not found",
      });
    }

    if (coordinator.role !== "BOOTH_COORDINATOR") {
      return res.status(400).json({
        success: false,
        message: "User is not a booth coordinator",
      });
    }

    const alreadyAssignedBooth =
      await Booth.findOne({
        assignedCoordinator: coordinatorId,
        organizationId: req.user.organizationId,
      });

    if (alreadyAssignedBooth && alreadyAssignedBooth._id.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message:
          "Coordinator is already assigned to another booth",
      });
    }

    const booth = await Booth.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    if (booth.assignedCoordinator && booth.assignedCoordinator.toString() !== coordinatorId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Selected booth is already assigned to another coordinator",
      });
    }

    const oldCoordinatorId = booth.assignedCoordinator;

    booth.assignedCoordinator = coordinatorId;
    await booth.save();

    // Sync new coordinator
    await User.updateOne(
      { _id: coordinatorId },
      { assignedBooth: booth._id }
    );

    // Sync old coordinator
    if (oldCoordinatorId && oldCoordinatorId.toString() !== coordinatorId.toString()) {
      await User.updateOne(
        { _id: oldCoordinatorId },
        { assignedBooth: null }
      );
    }

    res.status(200).json({
      success: true,
      message: "Coordinator assigned successfully",
      booth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const assignSectorOfficer = async (req, res) => {
  try {
    const { sectorOfficerId } = req.body;

    if (sectorOfficerId) {
      const sectorOfficer = await User.findOne({
        _id: sectorOfficerId,
        organizationId: req.user.organizationId,
      });

      if (!sectorOfficer) {
        return res.status(404).json({
          success: false,
          message: "Sector Officer not found",
        });
      }

      if (sectorOfficer.role !== "SECTOR_OFFICER") {
        return res.status(400).json({
          success: false,
          message: "User is not a sector officer",
        });
      }
    }

    const booth = await Booth.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    const oldSectorOfficerId = booth.assignedSectorOfficer;

    booth.assignedSectorOfficer = sectorOfficerId || null;
    await booth.save();

    // Sync new sector officer
    if (sectorOfficerId) {
      await User.updateOne(
        { _id: sectorOfficerId },
        { assignedBooth: booth._id }
      );
    }

    // Sync old sector officer
    if (oldSectorOfficerId && oldSectorOfficerId.toString() !== (sectorOfficerId || '').toString()) {
      const otherBooth = await Booth.findOne({
        assignedSectorOfficer: oldSectorOfficerId,
        _id: { $ne: booth._id }
      });
      await User.updateOne(
        { _id: oldSectorOfficerId },
        { assignedBooth: otherBooth ? otherBooth._id : null }
      );
    }

    res.status(200).json({
      success: true,
      message: "Sector Officer assigned successfully",
      booth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateBoothStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booth = await Booth.findOneAndUpdate(
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

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: "Booth not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Booth ${status.toLowerCase()} successfully`,
      booth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createBooth,
  getAllBooths,
  getBoothById,
  updateBooth,
  assignCoordinator,
  assignSectorOfficer,
  updateBoothStatus,
};