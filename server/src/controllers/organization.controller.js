const Organization = require("../models/Organization");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createOrganization = async (req, res) => {
  try {
    const {
      name,
      type,
      contactPerson,
      mobileNumber,
      subscriptionStatus,
      aiTokens,
    } = req.body;

    const existingOrganization =
      await Organization.findOne({ name });

    if (existingOrganization) {
      return res.status(400).json({
        success: false,
        message: "Organization already exists",
      });
    }

    const organization =
      await Organization.create({
        name,
        type,
        contactPerson,
        mobileNumber,
        subscriptionStatus: subscriptionStatus || "TRIAL",
        aiTokens: aiTokens !== undefined ? Number(aiTokens) : 1000,
      });

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.params.id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrganization = async (req, res) => {
  try {
    const organization =
      await Organization.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleOrganizationStatus = async (req, res) => {
  try {
    const organization = await Organization.findById(
      req.params.id
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    organization.isActive = !organization.isActive;

    await organization.save();

    res.status(200).json({
      success: true,
      message: `Organization ${
        organization.isActive
          ? "activated"
          : "deactivated"
      } successfully`,
      organization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createPartyAdmin = async (req, res) => {
  try {
    const { name, mobileNumber, password } = req.body;

    const organization = await Organization.findById(
      req.params.organizationId
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const existingUser = await User.findOne({
      mobileNumber,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const partyAdmin = await User.create({
      name,
      mobileNumber,
      password: hashedPassword,
      role: "PARTY_ADMIN",
      organizationId: organization._id,
    });

    res.status(201).json({
      success: true,
      message: "Party Admin created successfully",
      user: {
        id: partyAdmin._id,
        name: partyAdmin.name,
        mobileNumber: partyAdmin.mobileNumber,
        role: partyAdmin.role,
        organizationId: partyAdmin.organizationId,
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
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleOrganizationStatus,
  createPartyAdmin,
};