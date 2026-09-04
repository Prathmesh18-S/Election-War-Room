import api from "./api";



export const getActivities =
  async () => {
    const response = await api.get(
      "/coordinator-activities"
    );

    return response.data;
  };

export const getActivityDashboard =
  async () => {
    const response = await api.get(
      "/coordinator-activities/dashboard"
    );

    return response.data;
  };

export const startActivity = async (data) => {
  const response = await api.post("/coordinator-activities", data);
  return response.data;
};

export const updateActivity = async (id, data) => {
  const response = await api.put(`/coordinator-activities/${id}`, data);
  return response.data;
};