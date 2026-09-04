const Organization = require("../models/Organization");
const User = require("../models/User");
const Election = require("../models/Election");
const Booth = require("../models/Booth");

const getSuperAdminDashboard = async (req, res) => {
  try {
    // Organization counts
    const totalOrganizations = await Organization.countDocuments();
    const activeOrganizations = await Organization.countDocuments({ isActive: true });
    const inactiveOrganizations = await Organization.countDocuments({ isActive: false });
    
    const trialOrganizations = await Organization.countDocuments({ subscriptionStatus: "TRIAL" });
    const expiredOrganizations = await Organization.countDocuments({ subscriptionStatus: "EXPIRED" });
    const activeSubscriptionOrgs = await Organization.countDocuments({ subscriptionStatus: "ACTIVE" });

    // User counts across platform
    const totalPartyAdmins = await User.countDocuments({ role: "PARTY_ADMIN" });
    const totalSectorOfficers = await User.countDocuments({ role: "SECTOR_OFFICER" });
    const totalBoothCoordinators = await User.countDocuments({ role: "BOOTH_COORDINATOR" });

    // Elections and Booths across platform
    const totalElections = await Election.countDocuments();
    const totalBooths = await Booth.countDocuments();

    // AI tokens sum
    const orgsForTokens = await Organization.find({}, "aiTokens");
    const totalTokensRemaining = orgsForTokens.reduce((sum, org) => sum + (org.aiTokens || 0), 0);

    // List of organizations with their associated Party Admin details
    const rawOrganizations = await Organization.find().sort({ createdAt: -1 });
    
    // Find all Party Admins
    const partyAdmins = await User.find({ role: "PARTY_ADMIN" }, "name mobileNumber organizationId");

    const organizationsList = rawOrganizations.map((org) => {
      const admin = partyAdmins.find((u) => u.organizationId && u.organizationId.toString() === org._id.toString());
      return {
        _id: org._id,
        name: org.name,
        type: org.type,
        contactPerson: org.contactPerson,
        mobileNumber: org.mobileNumber,
        subscriptionStatus: org.subscriptionStatus,
        aiTokens: org.aiTokens || 0,
        isActive: org.isActive,
        createdAt: org.createdAt,
        partyAdmin: admin ? { name: admin.name, mobileNumber: admin.mobileNumber } : null,
      };
    });

    res.status(200).json({
      success: true,
      dashboard: {
        totalOrganizations,
        activeOrganizations,
        inactiveOrganizations,
        trialOrganizations,
        expiredOrganizations,
        activeSubscriptionOrgs,
        totalPartyAdmins,
        totalSectorOfficers,
        totalBoothCoordinators,
        totalElections,
        totalBooths,
        totalTokensRemaining,
        organizations: organizationsList,
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
  getSuperAdminDashboard,
};
