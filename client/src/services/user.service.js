import api from "./api";

export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const createSectorOfficer = async (
  data
) => {
  const response = await api.post(
    "/users/sector-officer",
    data
  );

  return response.data;
};

export const createBoothCoordinator =
  async (data) => {
    const response = await api.post(
      "/users/booth-coordinator",
      data
    );

    return response.data;
  };

export const updateUser = async (
  userId,
  data
) => {
  const response = await api.put(
    `/users/${userId}`,
    data
  );

  return response.data;
};