const getTodayFilter = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

/**
 * Returns a date filter for a specific election date (start of day to end of day).
 * Used when viewing historical election analytics.
 * @param {Date|string} electionDate
 */
const getElectionDateFilter = (electionDate) => {
  const start = new Date(electionDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(electionDate);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
};

/**
 * Returns true if the current local time is within election operating hours:
 * 7:00 AM (inclusive) to 7:00 PM (exclusive, i.e., hour < 19).
 */
const isWithinElectionHours = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19;
};

module.exports = {
  getTodayFilter,
  getElectionDateFilter,
  isWithinElectionHours,
};
