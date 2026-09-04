import api from "./api";

export const getSectorDashboard = async () => {
  const response = await api.get("/sector/dashboard");
  return response.data;
};
