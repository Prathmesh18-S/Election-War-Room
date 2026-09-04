import api from "./api";

export const getSuperAdminDashboard = async () => {
  const response = await api.get("/super-admin/dashboard");
  return response.data;
};

export const createOrganization = async (orgData) => {
  const response = await api.post("/organizations", orgData);
  return response.data;
};

export const updateOrganization = async (orgId, orgData) => {
  const response = await api.put(`/organizations/${orgId}`, orgData);
  return response.data;
};

export const toggleOrganizationStatus = async (orgId) => {
  const response = await api.patch(`/organizations/${orgId}/toggle-status`);
  return response.data;
};

export const createPartyAdmin = async (orgId, adminData) => {
  const response = await api.post(`/organizations/${orgId}/party-admin`, adminData);
  return response.data;
};
