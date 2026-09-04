import api from "./api";

export const getIssues = async () => {
  const response = await api.get("/issues");
  return response.data;
};

export const createIssue = async (data) => {
  const response = await api.post("/issues", data);
  return response.data;
};

export const updateIssueStatus = async (issueId, data) => {
  const response = await api.patch(`/issues/${issueId}/status`, data);
  return response.data;
};

export const getIssueDashboard = async () => {
  const response = await api.get("/issues/dashboard");
  return response.data;
};

/**
 * Re-run AI analysis for a single issue by ID.
 * Returns the updated issue document.
 */
export const retryIssueAi = async (issueId) => {
  const response = await api.post(`/issues/${issueId}/retry-ai`);
  return response.data;
};

/**
 * Re-run AI analysis for ALL issues that still have null aiPriority.
 * Returns { updated, failed } counts.
 */
export const retryAllIssuesAi = async () => {
  const response = await api.post("/issues/retry-ai-all");
  return response.data;
};