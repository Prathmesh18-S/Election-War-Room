import api from "./api";

/**
 * GET /api/analytics/turnout-prediction?electionId=<id>
 * Returns { trendData, prediction: { predictedTurnout, confidence, reason }, election }
 * If electionId is omitted, defaults to the currently active election.
 */
export const getTurnoutPrediction = async (electionId) => {
  const params = electionId ? { electionId } : {};
  const response = await api.get("/analytics/turnout-prediction", { params });
  return response.data;
};

/**
 * GET /api/analytics/booth-health?electionId=<id>
 * Returns { summary, booths: [{ boothNumber, healthScore, healthStatus, details }], election }
 */
export const getBoothHealth = async (electionId) => {
  const params = electionId ? { electionId } : {};
  const response = await api.get("/analytics/booth-health", { params });
  return response.data;
};

/**
 * GET /api/analytics/risk-analysis?electionId=<id>
 * Returns { summary: { overallRisk, riskCounts }, booths: [...], election }
 */
export const getRiskAnalysis = async (electionId) => {
  const params = electionId ? { electionId } : {};
  const response = await api.get("/analytics/risk-analysis", { params });
  return response.data;
};

/**
 * GET /api/analytics/coordinator-performance?electionId=<id>
 * Returns { summary, coordinators: [{ coordinatorName, performanceScore, performanceRating }], election }
 */
export const getCoordinatorPerformance = async (electionId) => {
  const params = electionId ? { electionId } : {};
  const response = await api.get("/analytics/coordinator-performance", { params });
  return response.data;
};

/**
 * GET /api/analytics/election-health?electionId=<id>
 * Returns { electionHealth: { healthScore, healthStatus, breakdown, stats }, election }
 */
export const getElectionHealth = async (electionId) => {
  const params = electionId ? { electionId } : {};
  const response = await api.get("/analytics/election-health", { params });
  return response.data;
};
