const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access the API key from environment variables.
const apiKey = process.env.GEMINI_API_KEY;

// Check if API Key is configured and not the default placeholder.
const isApiKeyConfigured = apiKey && apiKey !== "your_gemini_api_key_here";

let genAI = null;
let model = null;

if (isApiKeyConfigured) {
  genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-2.5-flash for fast, structured, and modern AI tasks
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  console.log("🚀 Google Gemini 2.5 Flash Service initialized successfully in ai.service.js.");
} else {
  console.warn("⚠️ WARNING: GEMINI_API_KEY is not configured or is the default placeholder. ai.service.js will run in MOCK mode.");
}

/**
 * Sleep helper for retry backoff.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call Gemini with up to maxRetries attempts, using exponential backoff on 503.
 * @param {string} prompt
 * @param {number} maxRetries
 */
const callGeminiWithRetry = async (prompt, maxRetries = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt}/${maxRetries}...`);
      const result = await model.generateContent(prompt);
      console.log(`[Gemini] Attempt ${attempt} succeeded.`);
      return result;
    } catch (err) {
      lastError = err;
      const is503 = err.status === 503 || (err.message && err.message.includes("503"));
      if (is503 && attempt < maxRetries) {
        const delay = 1500 * attempt; // 1.5s, 3s
        console.warn(`[Gemini] 503 on attempt ${attempt}. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
};

/**
 * Analyzes a reported issue to generate priority, summary, and resolution steps.
 * @param {string} title 
 * @param {string} description 
 * @param {string} issueType 
 * @returns {Promise<{aiPriority: string, aiSummary: string, aiSuggestedResolution: string}>}
 */
const analyzeIssue = async (title, description, issueType) => {
  console.log(`[analyzeIssue] START — issueType: ${issueType}, title: "${title}"`);

  if (!isApiKeyConfigured) {
    console.warn("[analyzeIssue] API key not configured — using FALLBACK.");
    return getFallbackIssueAnalysis(title, description, issueType);
  }

  // Build the prompt — use plain string concatenation to avoid any \n escape confusion
  const prompt = [
    "Analyze this election issue and return ONLY a valid JSON object (no markdown, no explanation).",
    "",
    "Issue Type: " + issueType,
    "Title: " + title,
    "Description: " + description,
    "",
    "Required JSON format:",
    '{',
    '  "aiPriority": "LOW | MEDIUM | HIGH | CRITICAL",',
    '  "aiSummary": "2-3 sentence summary of the issue",',
    '  "aiSuggestedResolution": "Step 1: ...\\nStep 2: ...\\nStep 3: ..."',
    '}'
  ].join("\n");

  try {
    console.log("[analyzeIssue] Calling Gemini API...");
    const result = await callGeminiWithRetry(prompt, 3);

    console.log("[analyzeIssue] Gemini returned a response object.");

    let responseText = result.response.text();

    if (!responseText || !responseText.trim()) {
      console.error("[analyzeIssue] Empty response text from Gemini! Falling back.");
      return getFallbackIssueAnalysis(title, description, issueType);
    }

    responseText = responseText.trim();
    console.log("[analyzeIssue] RAW RESPONSE:", responseText.substring(0, 300));

    // Strip any markdown code fences Gemini may wrap the JSON in
    responseText = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.error("[analyzeIssue] JSON.parse FAILED:", parseErr.message);
      console.error("[analyzeIssue] Raw text that failed parsing:", responseText);
      return getFallbackIssueAnalysis(title, description, issueType);
    }

    const aiResult = {
      aiPriority: parsed.aiPriority || "MEDIUM",
      aiSummary: parsed.aiSummary || "No summary generated.",
      aiSuggestedResolution: parsed.aiSuggestedResolution || "No suggested resolution generated.",
    };

    console.log("[analyzeIssue] Parsed OK — priority:", aiResult.aiPriority);
    return aiResult;

  } catch (error) {
    console.error("[analyzeIssue] Gemini call FAILED after retries:", error.message);
    console.error("[analyzeIssue] Falling back to keyword-based analysis.");
    return getFallbackIssueAnalysis(title, description, issueType);
  }
};

/**
 * Fallback generator for issue analysis when Gemini is unavailable.
 */
const getFallbackIssueAnalysis = (title, description, issueType) => {
  let priority = "MEDIUM";
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  if (lowerTitle.includes("evm") || lowerDesc.includes("not working") || lowerDesc.includes("faulty") || lowerDesc.includes("broken")) {
    priority = "CRITICAL";
  } else if (lowerTitle.includes("fight") || lowerDesc.includes("violence") || lowerDesc.includes("clash") || lowerDesc.includes("police") || lowerDesc.includes("lathi")) {
    priority = "HIGH";
  } else if (lowerTitle.includes("slow") || lowerDesc.includes("queue") || lowerDesc.includes("delay")) {
    priority = "MEDIUM";
  } else {
    priority = "LOW";
  }

  return {
    aiPriority: priority,
    aiSummary: `AI Summary (Fallback): A ${issueType.replace(/_/g, " ").toLowerCase()} issue regarding '${title}'. The reported details mention: "${description}"`,
    aiSuggestedResolution: `1. Check the physical device/booth location immediately.
2. Coordinate with designated Sector Officer and technicians.
3. Keep the War Room updated every 10 minutes until resolved.
4. Ensure queue management and voter security if crowd builds up.`
  };
};

/**
 * Generates an executive daily war room summary paragraph suitable for Party Admins.
 * @param {object} data 
 * @returns {Promise<string>}
 */
const generateDailySummary = async (data) => {
  if (!isApiKeyConfigured) {
    return getFallbackDailySummary(data);
  }

  try {
    const prompt = `
Write an election summary from the following data.

${JSON.stringify(data)}

Write one professional paragraph.
`;

    console.log("🚀 Calling Gemini Summary...");

    const result = await model.generateContent(prompt);

    console.log("✅ Summary Generated");

    return result.response.text().trim();
  } catch (err) {
    console.error(err);

    return getFallbackDailySummary(data);
  }
};

/**
 * Fallback generator for daily summary when Gemini is unavailable.
 */
const getFallbackDailySummary = (data) => {
  return `As of now, election operations are underway for the active elections. Out of a total of ${data.totalBooths} booths (${data.activeBooths} active), polling has successfully started in ${data.pollingStarted} booths. A total of ${data.totalVotes} votes have been cast with an average turnout of ${data.averageTurnout}%. We currently have ${data.openIssues} open issues (including ${data.criticalIssues} critical) and ${data.resolvedIssues} resolved issues. The highest turnout was recorded at ${data.highestTurnoutBooth || 'N/A'}, while the lowest was at ${data.lowestTurnoutBooth || 'N/A'}. The overall status of the election is ${data.overallElectionStatus}.`;
};

/**
 * Generates strategic dashboard insights.
 * @param {object} data 
 * @returns {Promise<string[]>}
 */
const generateDashboardInsights = async (data) => {
  if (!isApiKeyConfigured) {
    return getFallbackInsights(data);
  }

  try {
    const prompt = `
Analyze the following election dashboard.

Activities:
${JSON.stringify(data.activities)}

Turnout:
${JSON.stringify(data.turnout)}

Issues:
${JSON.stringify(data.issues)}

Recent Issues:
${JSON.stringify(data.recentIssues)}

Return ONLY valid JSON.

{
  "insights":[
    "Insight 1",
    "Insight 2",
    "Insight 3",
    "Insight 4",
    "Insight 5"
  ]
}
`;

    console.log("🚀 Calling Gemini Dashboard...");

    const result = await model.generateContent(prompt);

    console.log("✅ Gemini Dashboard Response");

    let text = result.response.text().trim();

    console.log(text);

    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(text);

    return parsed.insights || [];
  } catch (err) {
    console.error(err);

    return getFallbackInsights(data);
  }
};

/**
 * Fallback generator for strategic insights when Gemini is unavailable.
 */
const getFallbackInsights = (data) => {
  const insights = [];
  if (data.issues.openIssues > 0) {
    insights.push(`${data.issues.openIssues} open issues currently require coordinator attention.`);
  }
  if (data.activities.evmIssueCount > 0) {
    insights.push(`${data.activities.evmIssueCount} EVM issues reported; technicians should be dispatched.`);
  }
  if (data.turnout.averageTurnoutPercentage < 50) {
    insights.push(`Overall turnout is currently below 50% (${data.turnout.averageTurnoutPercentage}%); mobilization efforts should be increased.`);
  } else {
    insights.push(`Voter turnout is progressing steadily, averaging ${data.turnout.averageTurnoutPercentage}%.`);
  }
  if (data.activities.pollingStartedCount < data.activities.arrivedCount) {
    insights.push(`Some checked-in coordinators have not yet started polling operations.`);
  }
  
  // Add generic insights if needed to ensure at least 5
  if (insights.length < 5) {
    insights.push("Polling operations are active across the constituency.");
    insights.push("Establish contact with coordinators who have not checked in.");
    insights.push("Ensure local booth managers coordinate with security forces.");
    insights.push("Monitor turnout trends to identify high-density voting windows.");
    insights.push("Ensure backup EVMs are ready for dispatch from sector headquarters.");
  }
  return insights.slice(0, 10);
};

// ─────────────────────────────────────────────────────────────
// PHASE 2 — AI TURNOUT PREDICTION
// ─────────────────────────────────────────────────────────────

/**
 * Deterministic fallback for turnout prediction using linear extrapolation.
 * @param {object} trendData - output from computeTurnoutTrendData()
 * @returns {{ predictedTurnout: number, confidence: string, reason: string }}
 */
const getFallbackTurnoutPrediction = (trendData) => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour < 7) {
    return {
      predictedTurnout: 0,
      confidence: "Low",
      reason: "Polling has not yet started (polling is from 7:00 AM to 6:00 PM).",
    };
  }

  if (currentHour >= 18) {
    return {
      predictedTurnout: Math.round(trendData.currentAvgTurnout),
      confidence: "High",
      reason: "Polling has concluded (6:00 PM). The predicted turnout is equal to the final reported average turnout.",
    };
  }

  const { hourlyTrend, currentAvgTurnout, latestHour, totalBooths, boothsReported } = trendData;

  if (!hourlyTrend || hourlyTrend.length === 0) {
    return {
      predictedTurnout: 0,
      confidence: "Low",
      reason: "No turnout data available yet. Prediction cannot be made.",
    };
  }

  let predictedTurnout = currentAvgTurnout;
  let confidence = "Low";
  let reason = "";

  if (hourlyTrend.length >= 2) {
    // Simple linear slope from last two data points
    const last = hourlyTrend[hourlyTrend.length - 1];
    const prev = hourlyTrend[hourlyTrend.length - 2];
    const slope = last.avgTurnoutPct - prev.avgTurnoutPct;
    const hoursRemaining = Math.max(0, 18 - (latestHour || 0)); // assume polls close at 18:00
    predictedTurnout = Math.min(100, Math.max(0, currentAvgTurnout + slope * hoursRemaining));
    confidence = hourlyTrend.length >= 4 ? "Medium" : "Low";
    reason = `Based on ${hourlyTrend.length} hourly data points. Current average is ${currentAvgTurnout}% with a trend of ${slope > 0 ? "+" : ""}${slope.toFixed(1)}% per hour.`;
  } else {
    reason = `Only ${hourlyTrend.length} data point(s) available. Prediction is based solely on current average of ${currentAvgTurnout}%.`;
  }

  // Boost confidence if most booths are reporting
  if (totalBooths > 0 && boothsReported / totalBooths >= 0.8 && hourlyTrend.length >= 3) {
    confidence = "High";
  }

  return {
    predictedTurnout: Math.round(predictedTurnout),
    confidence,
    reason,
  };
};

/**
 * Use Gemini to predict final election day turnout from hourly trend data.
 * @param {object} trendData - output from computeTurnoutTrendData()
 * @returns {Promise<{ predictedTurnout: number, confidence: string, reason: string }>}
 */
const predictTurnout = async (trendData) => {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour < 7) {
    return {
      predictedTurnout: 0,
      confidence: "Low",
      reason: "Polling has not yet started (polling is from 7:00 AM to 6:00 PM).",
    };
  }

  if (currentHour >= 18) {
    return {
      predictedTurnout: Math.round(trendData.currentAvgTurnout),
      confidence: "High",
      reason: "Polling has concluded (6:00 PM). The predicted turnout is equal to the final reported average turnout.",
    };
  }

  if (!isApiKeyConfigured) {
    console.warn("[predictTurnout] API key not configured — using FALLBACK.");
    return getFallbackTurnoutPrediction(trendData);
  }

  const prompt = [
    "You are an election analytics AI. Based on the following hourly turnout trend data, predict the final turnout percentage for election day.",
    "",
    "Hourly Trend Data:",
    JSON.stringify(trendData.hourlyTrend),
    "",
    "Current Average Turnout: " + trendData.currentAvgTurnout + "%",
    "Latest Reported Hour: " + (trendData.latestHour !== null ? trendData.latestHour + ":00" : "No data"),
    "Total Booths: " + trendData.totalBooths,
    "Booths Reporting: " + trendData.boothsReported,
    "",
    "Assume polling closes at 18:00 (6 PM). Use the trend to extrapolate.",
    "Return ONLY valid JSON (no markdown, no explanation):",
    '{',
    '  "predictedTurnout": <integer 0-100>,',
    '  "confidence": "Low | Medium | High",',
    '  "reason": "<1-2 sentence explanation>"',
    '}',
  ].join("\n");

  try {
    console.log("[predictTurnout] Calling Gemini...");
    const result = await callGeminiWithRetry(prompt, 3);
    let text = result.response.text().trim();
    console.log("[predictTurnout] Raw response:", text.substring(0, 200));

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("[predictTurnout] JSON parse failed:", e.message);
      return getFallbackTurnoutPrediction(trendData);
    }

    return {
      predictedTurnout: Math.round(Number(parsed.predictedTurnout) || trendData.currentAvgTurnout),
      confidence: parsed.confidence || "Low",
      reason: parsed.reason || "AI analysis completed.",
    };
  } catch (err) {
    console.error("[predictTurnout] Gemini call FAILED after retries:", err.message);
    return getFallbackTurnoutPrediction(trendData);
  }
};

/**
 * Generates an overall narrative summary of election risk based on booth risk data.
 * @param {object} riskSummary - { overallRisk, riskCounts, totalBooths }
 * @param {Array} highRiskBooths - Array of HIGH/CRITICAL risk booth objects
 * @returns {Promise<string>}
 */
const generateRiskSummary = async (riskSummary, highRiskBooths = []) => {
  if (!isApiKeyConfigured) {
    return getFallbackRiskSummary(riskSummary, highRiskBooths);
  }

  const prompt = [
    "You are an election operations analyst. Write a concise 2-sentence risk assessment for the War Room based on the data below.",
    "",
    "Overall Risk Level: " + riskSummary.overallRisk,
    "Risk Breakdown: " + JSON.stringify(riskSummary.riskCounts),
    "Total Booths: " + riskSummary.totalBooths,
    "High/Critical Booths Sample: " + JSON.stringify(highRiskBooths.slice(0, 5)),
    "",
    "Return ONLY plain text (no JSON, no markdown). Write 2 sentences.",
  ].join("\n");

  try {
    console.log("[generateRiskSummary] Calling Gemini...");
    const result = await callGeminiWithRetry(prompt, 2);
    return result.response.text().trim();
  } catch (err) {
    console.error("[generateRiskSummary] Gemini failed, using fallback:", err.message);
    return getFallbackRiskSummary(riskSummary, highRiskBooths);
  }
};

/**
 * Deterministic fallback for risk narrative generation.
 */
const getFallbackRiskSummary = (riskSummary, highRiskBooths) => {
  const { overallRisk, riskCounts, totalBooths } = riskSummary;
  const atRisk = (riskCounts.HIGH || 0) + (riskCounts.CRITICAL || 0);
  return `Election risk is currently at ${overallRisk} level with ${atRisk} out of ${totalBooths} booths requiring immediate attention. ${
    atRisk > 0
      ? `Priority action needed at ${highRiskBooths
          .slice(0, 3)
          .map((b) => `Booth #${b.boothNumber}`)
          .join(", ")} due to unresolved issues or operational gaps.`
      : "All booths are operating within acceptable parameters."
  }`;
};

module.exports = {
  analyzeIssue,
  generateDailySummary,
  generateDashboardInsights,
  predictTurnout,
  generateRiskSummary,
};
