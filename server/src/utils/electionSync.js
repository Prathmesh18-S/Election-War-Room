const Election = require("../models/Election");

/**
 * Dynamically syncs all election statuses for an organization based on the current date and time:
 * - If election day is in the past: COMPLETED
 * - If election day is today: ACTIVE (before 7:00 PM) or COMPLETED (after 7:00 PM)
 * - If election day is in the future: UPCOMING
 */
const syncElectionStatuses = async (organizationId) => {
  try {
    const elections = await Election.find({ organizationId });
    const now = new Date();
    const nowZero = new Date(now);
    nowZero.setHours(0, 0, 0, 0);

    for (const election of elections) {
      const start = new Date(election.startDate);
      const startZero = new Date(start);
      startZero.setHours(0, 0, 0, 0);

      let calculatedStatus = "UPCOMING";

      if (startZero < nowZero) {
        calculatedStatus = "COMPLETED";
      } else if (startZero.getTime() === nowZero.getTime()) {
        if (now.getHours() >= 19) {
          calculatedStatus = "COMPLETED";
        } else {
          calculatedStatus = "ACTIVE";
        }
      } else {
        calculatedStatus = "UPCOMING";
      }

      if (election.status !== calculatedStatus) {
        election.status = calculatedStatus;
        await election.save();
      }
    }
  } catch (error) {
    console.error("[syncElectionStatuses] Error syncing statuses:", error.message);
  }
};

module.exports = {
  syncElectionStatuses,
};
