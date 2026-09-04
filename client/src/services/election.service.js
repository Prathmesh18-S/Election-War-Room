import api from "./api";

export const getElections = async () => {
  const response = await api.get(
    "/elections"
  );

  return response.data;
};

export const createElection = async (data) => {
  const response = await api.post(
    "/elections",
    data
  );

  return response.data;
};

export const updateElection = async (electionId, data) => {
  const response = await api.put(
    `/elections/${electionId}`,
    data
  );

  return response.data;
};