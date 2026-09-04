import api from "./api";

export const getCoordinatorDashboard = async () => {
  const response = await api.get("/coordinator/dashboard");
  return response.data;
};
