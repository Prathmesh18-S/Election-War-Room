const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Election = require("../models/Election");
const Booth = require("../models/Booth");

const createSectorOfficer = async (req, res) => {
  try {
    const { name, mobileNumber, email, password, assignedElection, assignedBooth } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { mobileNumber },
        ...(email ? [{ email }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Validate assigned election
    if (assignedElection) {
      const election = await Election.findOne({
        _id: assignedElection,
        organizationId: req.user.organizationId,
      });
      if (!election) {
        return res.status(400).json({
          success: false,
          message: "Assigned election is invalid",
        });
      }
    }

    // Validate assigned booth
    if (assignedBooth) {
      const booth = await Booth.findOne({
        _id: assignedBooth,
        organizationId: req.user.organizationId,
      });
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: "Assigned booth is invalid",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const sectorOfficer = await User.create({
      name,
      mobileNumber,
      email,
      password: hashedPassword,
      role: "SECTOR_OFFICER",
      organizationId: req.user.organizationId,
      createdBy: req.user.id,
      assignedElection: assignedElection || null,
      assignedBooth: assignedBooth || null,
    });

    if (assignedBooth) {
      const booth = await Booth.findOne({ _id: assignedBooth, organizationId: req.user.organizationId });
      if (booth) {
        const oldSectorOfficerId = booth.assignedSectorOfficer;
        if (oldSectorOfficerId && oldSectorOfficerId.toString() !== sectorOfficer._id.toString()) {
          const otherBooth = await Booth.findOne({
            assignedSectorOfficer: oldSectorOfficerId,
            _id: { $ne: booth._id }
          });
          await User.updateOne(
            { _id: oldSectorOfficerId },
            { assignedBooth: otherBooth ? otherBooth._id : null }
          );
        }
        booth.assignedSectorOfficer = sectorOfficer._id;
        await booth.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Sector Officer created successfully",
      user: {
        id: sectorOfficer._id,
        name: sectorOfficer.name,
        mobileNumber: sectorOfficer.mobileNumber,
        role: sectorOfficer.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createBoothCoordinator = async (req, res) => {
  try {
    const { name, mobileNumber, email, password, assignedElection, assignedBooth } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { mobileNumber },
        ...(email ? [{ email }] : []),
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Validate assigned election
    if (assignedElection) {
      const election = await Election.findOne({
        _id: assignedElection,
        organizationId: req.user.organizationId,
      });
      if (!election) {
        return res.status(400).json({
          success: false,
          message: "Assigned election is invalid",
        });
      }
    }

    // Validate assigned booth
    if (assignedBooth) {
      const booth = await Booth.findOne({
        _id: assignedBooth,
        organizationId: req.user.organizationId,
      });
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: "Assigned booth is invalid",
        });
      }
      if (booth.assignedCoordinator) {
        return res.status(400).json({
          success: false,
          message: "Selected booth is already assigned to another coordinator",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const coordinator = await User.create({
      name,
      mobileNumber,
      email,
      password: hashedPassword,
      role: "BOOTH_COORDINATOR",
      organizationId: req.user.organizationId,
      createdBy: req.user.id,
      assignedElection: assignedElection || null,
      assignedBooth: assignedBooth || null,
    });

    if (assignedBooth) {
      const booth = await Booth.findOne({ _id: assignedBooth, organizationId: req.user.organizationId });
      if (booth) {
        if (booth.assignedCoordinator) {
          await User.updateOne(
            { _id: booth.assignedCoordinator },
            { assignedBooth: null }
          );
        }
        booth.assignedCoordinator = coordinator._id;
        await booth.save();
      }
    }

    res.status(201).json({
      success: true,
      message: "Booth Coordinator created successfully",
      user: {
        id: coordinator._id,
        name: coordinator.name,
        mobileNumber: coordinator.mobileNumber,
        role: coordinator.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      organizationId: req.user.organizationId,
    })
      .select("-password")
      .populate("assignedElection", "name type status")
      .populate("assignedBooth", "boothNumber pollingStationName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, mobileNumber, email, role, assignedElection, assignedBooth } = req.body;

    const user = await User.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (mobileNumber && mobileNumber !== user.mobileNumber) {
      const existingMobile = await User.findOne({
        mobileNumber,
        _id: { $ne: req.params.id },
      });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile number already in use",
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    if (assignedElection) {
      const election = await Election.findOne({
        _id: assignedElection,
        organizationId: req.user.organizationId,
      });
      if (!election) {
        return res.status(400).json({
          success: false,
          message: "Assigned election is invalid",
        });
      }
    }

    if (assignedBooth) {
      const booth = await Booth.findOne({
        _id: assignedBooth,
        organizationId: req.user.organizationId,
      });
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: "Assigned booth is invalid",
        });
      }
      const targetRole = role || user.role;
      if (
        targetRole === "BOOTH_COORDINATOR" &&
        booth.assignedCoordinator &&
        booth.assignedCoordinator.toString() !== user._id.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Selected booth is already assigned to another coordinator",
        });
      }
    }

    const isBoothChanged = assignedBooth !== undefined && String(assignedBooth || '') !== String(user.assignedBooth || '');
    const oldBoothId = user.assignedBooth;

    user.name = name || user.name;
    user.mobileNumber = mobileNumber || user.mobileNumber;
    user.email = email || user.email;
    user.role = role || user.role;
    user.assignedElection = assignedElection !== undefined ? assignedElection || null : user.assignedElection;
    user.assignedBooth = assignedBooth !== undefined ? assignedBooth || null : user.assignedBooth;

    await user.save();

    if (isBoothChanged) {
      if (user.role === "BOOTH_COORDINATOR") {
        if (oldBoothId) {
          await Booth.updateOne(
            { _id: oldBoothId, assignedCoordinator: user._id },
            { assignedCoordinator: null }
          );
        }
        if (user.assignedBooth) {
          const booth = await Booth.findOne({ _id: user.assignedBooth, organizationId: req.user.organizationId });
          if (booth) {
            if (booth.assignedCoordinator && booth.assignedCoordinator.toString() !== user._id.toString()) {
              await User.updateOne(
                { _id: booth.assignedCoordinator },
                { assignedBooth: null }
              );
            }
            booth.assignedCoordinator = user._id;
            await booth.save();
          }
        }
        // Clear any other booths assigned to this coordinator
        await Booth.updateMany(
          { assignedCoordinator: user._id, _id: { $ne: user.assignedBooth } },
          { assignedCoordinator: null }
        );
      } else if (user.role === "SECTOR_OFFICER") {
        if (oldBoothId) {
          await Booth.updateOne(
            { _id: oldBoothId, assignedSectorOfficer: user._id },
            { assignedSectorOfficer: null }
          );
        }
        if (user.assignedBooth) {
          const booth = await Booth.findOne({ _id: user.assignedBooth, organizationId: req.user.organizationId });
          if (booth) {
            const oldSectorOfficerId = booth.assignedSectorOfficer;
            if (oldSectorOfficerId && oldSectorOfficerId.toString() !== user._id.toString()) {
              const otherBooth = await Booth.findOne({
                assignedSectorOfficer: oldSectorOfficerId,
                _id: { $ne: booth._id }
              });
              await User.updateOne(
                { _id: oldSectorOfficerId },
                { assignedBooth: otherBooth ? otherBooth._id : null }
              );
            }
            booth.assignedSectorOfficer = user._id;
            await booth.save();
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        mobileNumber: user.mobileNumber,
        email: user.email,
        role: user.role,
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
  createSectorOfficer,
  createBoothCoordinator,
  getAllUsers,
  updateUser,
};
