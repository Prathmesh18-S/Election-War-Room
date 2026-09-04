import api from "./api";

export const getBooths = async () => {
  const response = await api.get("/booths");
  return response.data;
};

export const createBooth = async (data) => {
  const response = await api.post(
    "/booths",
    data
  );

  return response.data;
};

export const updateBooth = async (boothId, data) => {
  const response = await api.put(
    `/booths/${boothId}`,
    data
  );

  return response.data;
};

export const assignCoordinator = async (
  boothId,
  coordinatorId
) => {
  const response = await api.patch(
    `/booths/${boothId}/assign-coordinator`,
    {
      coordinatorId,
    }
  );

  return response.data;
};

export const assignSectorOfficer = async (
  boothId,
  sectorOfficerId
) => {
  const response = await api.patch(
    `/booths/${boothId}/assign-sector-officer`,
    {
      sectorOfficerId,
    }
  );

  return response.data;
};