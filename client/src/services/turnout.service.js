import api from "./api";

export const getTurnoutRecords = async () => {
  const response = await api.get("/turnout");
  return response.data;
};

export const getTurnoutDashboard =
  async () => {
    const response = await api.get(
      "/turnout/dashboard"
    );

    return response.data;
  };

export const submitTurnout = async (data) => {
  const response = await api.post(
    "/turnout",
    data
  );

  return response.data;
};