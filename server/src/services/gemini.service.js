// Wrapper to preserve compatibility with existing modules
const aiService = require("./ai.service");

module.exports = {
  analyzeIssue: aiService.analyzeIssue,
  generateWarRoomSummary: aiService.generateDailySummary,
  generateDashboardInsights: aiService.generateDashboardInsights,
};
