import api from "./api";

export const getDailySummary = async () => {
  const response = await api.get("/ai/daily-summary");
  return response.data;
};

export const getWarRoomSummary = async () => {
  const response = await api.get("/ai/war-room-summary");
  return response.data;
};

export const getDashboardInsights = async () => {
  const response = await api.get("/ai/dashboard-insights");
  return response.data;
};
