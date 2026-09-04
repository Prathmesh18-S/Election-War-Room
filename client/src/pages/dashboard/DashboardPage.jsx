import { useEffect, useState, useCallback } from "react";
import { getDashboardSummary } from "../../services/dashboard.service";
import { getDailySummary, getDashboardInsights } from "../../services/ai.service";
import {
  getTurnoutPrediction,
  getBoothHealth,
  getRiskAnalysis,
  getCoordinatorPerformance,
  getElectionHealth,
} from "../../services/analytics.service";
import { getElections } from "../../services/election.service";
import MainLayout from "../../components/layout/MainLayout";

// ─── Utility Helpers ──────────────────────────────────────────────────────────

const RISK_COLOR = {
  CRITICAL: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/30", dot: "bg-rose-500" },
  HIGH:     { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" },
  MEDIUM:   { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-500" },
  LOW:      { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500" },
};

const HEALTH_COLOR = {
  Excellent:       { ring: "#22c55e", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  Good:            { ring: "#22c55e", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  Stable:          { ring: "#3b82f6", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  Average:         { ring: "#f59e0b", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  "Needs Attention": { ring: "#f59e0b", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  Poor:            { ring: "#f97316", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  Critical:        { ring: "#ef4444", badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
};

const PERF_BAR_COLOR = (score) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

// ─── Skeleton Loader ─────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-800 rounded ${className}`} />
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, trend, gradient }) => (
  <div className={`rounded-2xl border border-slate-800 bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 group`}>
    <div className="flex items-start justify-between mb-4">
      <div className="text-4xl opacity-20 group-hover:opacity-30 transition-opacity">{icon}</div>
      {trend !== undefined && trend !== 0 && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-sm text-slate-400 font-medium uppercase tracking-wide mb-2">{label}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

// ─── Score Ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score = 0, status = "Unknown", size = 130 }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = (HEALTH_COLOR[status] || HEALTH_COLOR["Critical"]).ring;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={ringColor} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="60" y="56" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="sans-serif">
          {score}
        </text>
        <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
          / 100
        </text>
      </svg>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, badge }) => (
  <div className="flex items-center justify-between mb-5">
    <h2 className="text-lg font-bold text-white flex items-center gap-2">
      <span>{icon}</span> {title}
    </h2>
    {badge && (
      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-full border border-indigo-500/20">
        {badge}
      </span>
    )}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
function DashboardPage() {
  // Phase 1 state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState("");
  const [insights, setInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(true);

  // Phase 2 state
  const [electionHealth, setElectionHealth] = useState(null);
  const [turnoutPrediction, setTurnoutPrediction] = useState(null);
  const [boothHealth, setBoothHealth] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [coordPerformance, setCoordPerformance] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Elections list for selector
  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState(""); // "" = active election (default)
  const [selectedElection, setSelectedElection] = useState(null);

  const [boothSortField, setBoothSortField] = useState("healthScore");
  const [boothSortDir, setBoothSortDir] = useState("desc");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setAiLoading(true);
    setAnalyticsLoading(true);

    // Phase 1 — main dashboard
    try {
      const summaryData = await getDashboardSummary();
      if (summaryData.success) setData(summaryData.summary);
    } catch (e) {
      console.error("Dashboard summary failed:", e);
    } finally {
      setLoading(false);
    }

    // Phase 1 — AI summary / insights
    try {
      const [summaryRes, insightsRes] = await Promise.all([getDailySummary(), getDashboardInsights()]);
      if (summaryRes.success) setDailySummary(summaryRes.summary);
      if (insightsRes.success) setInsights(insightsRes.insights);
    } catch (e) {
      console.error("AI summary/insights failed:", e);
    } finally {
      setAiLoading(false);
    }

    // Load elections list
    try {
      const electionsRes = await getElections();
      if (electionsRes.success) {
        const sorted = [...(electionsRes.elections || [])].sort((a, b) => {
          const order = { ACTIVE: 0, UPCOMING: 1, COMPLETED: 2 };
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });
        setElections(sorted);
        // Auto-select the active election
        const active = sorted.find((e) => e.status === "ACTIVE");
        if (active) {
          setSelectedElectionId(active._id);
          setSelectedElection(active);
        }
      }
    } catch (e) {
      console.error("Elections load failed:", e);
    }

    // Phase 2 — Analytics (default: active election)
    await fetchAnalytics("");
  }, []); // eslint-disable-line

  const fetchAnalytics = useCallback(async (electionId) => {
    setAnalyticsLoading(true);
    try {
      const [healthRes, turnoutRes, boothRes, riskRes, coordRes] = await Promise.allSettled([
        getElectionHealth(electionId || undefined),
        getTurnoutPrediction(electionId || undefined),
        getBoothHealth(electionId || undefined),
        getRiskAnalysis(electionId || undefined),
        getCoordinatorPerformance(electionId || undefined),
      ]);

      if (healthRes.status === "fulfilled" && healthRes.value.success) {
        setElectionHealth(healthRes.value.electionHealth);
        if (healthRes.value.election) setSelectedElection(healthRes.value.election);
      }
      if (turnoutRes.status === "fulfilled" && turnoutRes.value.success) setTurnoutPrediction(turnoutRes.value);
      if (boothRes.status === "fulfilled" && boothRes.value.success) setBoothHealth(boothRes.value);
      if (riskRes.status === "fulfilled" && riskRes.value.success) setRiskAnalysis(riskRes.value);
      if (coordRes.status === "fulfilled" && coordRes.value.success) setCoordPerformance(coordRes.value);
    } catch (e) {
      console.error("Analytics fetch failed:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // When user changes the election in the dropdown
  const handleElectionChange = useCallback((e) => {
    const id = e.target.value;
    setSelectedElectionId(id);
    const found = elections.find((el) => el._id === id);
    setSelectedElection(found || null);
    fetchAnalytics(id);
  }, [elections, fetchAnalytics]);

  if (loading && !data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
            <p className="text-slate-400">Loading dashboard…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { overview, recentActivities, recentIssues, charts } = data;

  // ── Sorted booth health data ──
  const sortedBooths = boothHealth?.booths
    ? [...boothHealth.booths].sort((a, b) => {
        const av = a[boothSortField] ?? 0;
        const bv = b[boothSortField] ?? 0;
        return boothSortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      })
    : [];

  const toggleBoothSort = (field) => {
    if (boothSortField === field) setBoothSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setBoothSortField(field); setBoothSortDir("desc"); }
  };

  const highRiskBooths = riskAnalysis?.booths?.filter((b) => b.riskLevel === "HIGH" || b.riskLevel === "CRITICAL") || [];

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Election Dashboard</h1>
              <p className="text-slate-400 mt-2">Real-time monitoring and AI-powered analytics</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              <span className="mr-2">🔄</span> Refresh
            </button>
          </div>

          {/* ── Phase 1: Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Elections" value={overview.totalElections} icon="🗳️" gradient="from-slate-900 to-slate-800" />
            <StatCard label="Total Booths" value={overview.totalBooths} icon="🏢" gradient="from-slate-900 to-slate-800" />
            <StatCard label="Coordinators" value={overview.totalCoordinators} icon="👥" gradient="from-slate-900 to-slate-800" />
            <StatCard label="Total Votes" value={overview.totalVotes?.toLocaleString() || 0} icon="✅" gradient="from-blue-950 to-slate-900" trend={12} />
            <StatCard label="Avg Turnout" value={`${overview.averageTurnoutPercentage}%`} icon="📊" gradient="from-emerald-950 to-slate-900" trend={8} />
            <StatCard label="Open Issues" value={overview.openIssues} icon="⚠️" gradient={overview.openIssues > 0 ? "from-rose-950 to-slate-900" : "from-slate-900 to-slate-800"} trend={overview.openIssues > 0 ? -15 : 0} />
          </div>

          {/* ── Phase 1: AI Operations Hub ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 p-6 backdrop-blur shadow-lg shadow-indigo-500/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-xl">🤖</span> AI Daily War Room Summary
                </h2>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-full border border-indigo-500/20">Party Admin Only</span>
              </div>
              {aiLoading ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed text-sm md:text-base font-medium">
                  {dailySummary || "No summary available at the moment."}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-indigo-400">💡</span> AI Dashboard Insights
              </h2>
              {aiLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                  <Skeleton className="h-3 w-11/12" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                  {insights?.length > 0 ? (
                    insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed hover:bg-slate-800/10 p-1.5 rounded transition">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-xs py-2">No strategic insights generated yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PHASE 2 — AI ANALYTICS SECTION DIVIDER + ELECTION SELECTOR
          ═══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left: Section label */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-sm">⚡</div>
                <div>
                  <p className="text-indigo-400 text-sm font-bold tracking-widest uppercase">AI Analytics</p>
                  <p className="text-slate-500 text-xs mt-0.5">Select an election to view its full analytics report</p>
                </div>
              </div>

              {/* Right: Election Dropdown */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedElection && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    selectedElection.status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : selectedElection.status === "COMPLETED"
                      ? "bg-slate-500/15 text-slate-400 border-slate-500/30"
                      : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  }`}>
                    {selectedElection.status === "ACTIVE" ? "🟢" : selectedElection.status === "COMPLETED" ? "🏁" : "🔵"} {selectedElection.status}
                  </span>
                )}
                <div className="relative">
                  <select
                    id="election-selector"
                    value={selectedElectionId}
                    onChange={handleElectionChange}
                    disabled={analyticsLoading || elections.length === 0}
                    className="appearance-none bg-slate-800 border border-slate-700 hover:border-indigo-500/60 text-white text-sm font-semibold rounded-xl px-4 py-2.5 pr-10 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[220px]"
                  >
                    {elections.length === 0 && (
                      <option value="">Loading elections…</option>
                    )}
                    {elections.map((el) => (
                      <option key={el._id} value={el._id}>
                        {el.status === "ACTIVE" ? "🟢" : el.status === "COMPLETED" ? "🏁" : "🔵"} {el.name} ({new Date(el.startDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
                </div>
                {analyticsLoading && (
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              WIDGET 1 — Election Health Score
          ══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800/60 p-6 shadow-lg">
            <SectionHeader icon="🏥" title="Election Health Score" badge="AI Composite" />
            {analyticsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="flex justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>
                <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
              </div>
            ) : electionHealth ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                {/* Score Ring */}
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={electionHealth.healthScore} status={electionHealth.healthStatus} size={140} />
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${(HEALTH_COLOR[electionHealth.healthStatus] || HEALTH_COLOR["Critical"]).badge}`}>
                    {electionHealth.healthStatus}
                  </span>
                </div>
                {/* Breakdown bars */}
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Booth Health", value: electionHealth.breakdown.avgBoothHealth, weight: "30%" },
                    { label: "Coordinator Perf.", value: electionHealth.breakdown.avgCoordinatorPerformance, weight: "20%" },
                    { label: "Issue Health", value: electionHealth.breakdown.issueHealth, weight: "20%" },
                    { label: "Avg Turnout", value: electionHealth.breakdown.avgTurnoutPct, weight: "20%" },
                    { label: "Polling Started", value: electionHealth.breakdown.pollingStartedPct, weight: "10%" },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-slate-300">{item.label}</span>
                        <span className="text-xs text-slate-500">{item.weight}</span>
                      </div>
                      <p className="text-2xl font-bold text-white mb-2">{item.value}%</p>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${PERF_BAR_COLOR(item.value)} transition-all duration-700`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                  {/* Stats summary */}
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-between">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Key Stats</p>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex justify-between"><span>Total Booths</span><span className="text-white font-bold">{electionHealth.stats?.totalBooths}</span></div>
                      <div className="flex justify-between"><span>Open Issues</span><span className="text-rose-400 font-bold">{electionHealth.stats?.openIssues}</span></div>
                      <div className="flex justify-between"><span>Polling Started</span><span className="text-emerald-400 font-bold">{electionHealth.stats?.pollingStarted}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4">Election health data unavailable.</p>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              WIDGET 2 — AI Turnout Prediction
          ══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 to-indigo-950/30 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-indigo-600/20 blur-3xl" />
            </div>
            <SectionHeader icon="🔮" title="AI Turnout Prediction" badge="Gemini Powered" />
            {analyticsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
              </div>
            ) : turnoutPrediction?.prediction ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Predicted Turnout */}
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 flex flex-col justify-between">
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wide mb-2">Predicted Final Turnout</p>
                  <p className="text-5xl font-black text-white">{turnoutPrediction.prediction.predictedTurnout}%</p>
                  <div className="mt-3">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                      turnoutPrediction.prediction.confidence === "High" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                      turnoutPrediction.prediction.confidence === "Medium" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                      "bg-slate-500/15 text-slate-400 border-slate-500/30"
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {turnoutPrediction.prediction.confidence} Confidence
                    </div>
                  </div>
                </div>
                {/* Current vs Predicted */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-4">Current vs Predicted</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Current Avg</span><span className="text-slate-200 font-bold">{turnoutPrediction.trendData?.currentAvgTurnout}%</span></div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${turnoutPrediction.trendData?.currentAvgTurnout}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">Predicted Final</span><span className="text-indigo-300 font-bold">{turnoutPrediction.prediction.predictedTurnout}%</span></div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${turnoutPrediction.prediction.predictedTurnout}%` }} /></div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    {turnoutPrediction.trendData?.boothsReported} / {turnoutPrediction.trendData?.totalBooths} booths reporting
                  </p>
                </div>
                {/* AI Reasoning */}
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">AI Reasoning</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{turnoutPrediction.prediction.reason}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4">Turnout prediction unavailable — no data submitted yet.</p>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              WIDGET 3 — Booth Health Table
          ══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🏢</span> Booth Health Monitor</h2>
              {boothHealth?.summary && (
                <div className="flex items-center gap-3 flex-wrap">
                  {Object.entries(boothHealth.summary.statusCounts).map(([status, count]) => count > 0 && (
                    <span key={status} className={`px-2 py-1 text-xs font-semibold rounded-full border ${(HEALTH_COLOR[status] || HEALTH_COLOR["Critical"]).badge}`}>
                      {status}: {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {analyticsLoading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : sortedBooths.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {[["Booth", "boothNumber"], ["Station", "pollingStationName"], ["Score", "healthScore"], ["Status", "healthStatus"], ["Turnout", null], ["Issues", null]].map(([label, field]) => (
                        <th key={label}
                          className={`px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide ${field ? "cursor-pointer hover:text-white select-none" : ""}`}
                          onClick={() => field && toggleBoothSort(field)}
                        >
                          {label} {field && boothSortField === field && (boothSortDir === "asc" ? "↑" : "↓")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {sortedBooths.slice(0, 15).map((booth) => (
                      <tr key={String(booth.boothId)} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-3 py-3 font-bold text-white">#{booth.boothNumber}</td>
                        <td className="px-3 py-3 text-slate-300 max-w-[160px] truncate">{booth.pollingStationName}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                              <div className={`h-full ${PERF_BAR_COLOR(booth.healthScore)}`} style={{ width: `${booth.healthScore}%`, transition: "width 0.5s" }} />
                            </div>
                            <span className="text-white font-bold text-xs">{booth.healthScore}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${(HEALTH_COLOR[booth.healthStatus] || HEALTH_COLOR["Critical"]).badge}`}>
                            {booth.healthStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-300 text-xs">{booth.details?.avgTurnoutPct ?? "—"}%</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-semibold ${booth.details?.openIssues > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                            {booth.details?.openIssues > 0 ? `⚠ ${booth.details.openIssues}` : "✓ 0"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sortedBooths.length > 15 && (
                  <p className="text-center text-slate-500 text-xs mt-3">Showing 15 of {sortedBooths.length} booths</p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4">No booth health data available.</p>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              WIDGET 4 + 6 — Risk Analysis (High Risk Panel + Summary)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* High Risk Booths Panel */}
            <div className="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-gradient-to-br from-slate-900 to-rose-950/10 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🚨</span> High Risk Booths</h2>
                {riskAnalysis?.summary && (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${(RISK_COLOR[riskAnalysis.summary.overallRisk] || RISK_COLOR.LOW).bg} ${(RISK_COLOR[riskAnalysis.summary.overallRisk] || RISK_COLOR.LOW).text} ${(RISK_COLOR[riskAnalysis.summary.overallRisk] || RISK_COLOR.LOW).border}`}>
                      Overall: {riskAnalysis.summary.overallRisk}
                    </span>
                  </div>
                )}
              </div>
              {analyticsLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
              ) : highRiskBooths.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {highRiskBooths.map((booth) => {
                    const col = RISK_COLOR[booth.riskLevel] || RISK_COLOR.LOW;
                    return (
                      <div key={String(booth.boothId)} className={`flex items-start gap-4 p-4 rounded-xl border ${col.bg} ${col.border}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${col.dot} mt-1 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-white text-sm">#{booth.boothNumber} — {booth.pollingStationName}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${col.bg} ${col.text} ${col.border} flex-shrink-0`}>{booth.riskLevel}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{booth.constituency}</p>
                          <div className="flex flex-wrap gap-1">
                            {booth.riskFlags?.slice(0, 3).map((flag, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/50">
                                {flag.message || flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <span className="text-4xl">✅</span>
                  <p className="text-emerald-400 font-semibold">No high-risk booths detected</p>
                  <p className="text-slate-500 text-sm">All booths are operating within acceptable risk levels.</p>
                </div>
              )}
            </div>

            {/* Risk Summary Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg flex flex-col gap-5">
              <SectionHeader icon="📊" title="Risk Overview" />
              {analyticsLoading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
              ) : riskAnalysis?.summary ? (
                <>
                  {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => {
                    const col = RISK_COLOR[level];
                    const count = riskAnalysis.summary.riskCounts[level] || 0;
                    const pct = riskAnalysis.summary.totalBooths > 0 ? (count / riskAnalysis.summary.totalBooths) * 100 : 0;
                    return (
                      <div key={level}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className={col.text}>{level}</span>
                          <span className="text-slate-300">{count} booths</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${col.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-auto pt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-400">
                      Total: <span className="text-white font-bold">{riskAnalysis.summary.totalBooths}</span> booths assessed
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No risk data available.</p>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              WIDGET 5 — Coordinator Leaderboard
          ══════════════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><span>🏆</span> Coordinator Leaderboard</h2>
              {coordPerformance?.summary && (
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Avg Score: <span className="text-white font-bold">{coordPerformance.summary.avgScore}</span></span>
                  <span>Total: <span className="text-white font-bold">{coordPerformance.summary.total}</span></span>
                </div>
              )}
            </div>
            {analyticsLoading ? (
              <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : coordPerformance?.coordinators?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Coordinator</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Booth</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Rating</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Achievements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {coordPerformance.coordinators.slice(0, 12).map((coord, idx) => (
                      <tr key={String(coord.coordinatorId || idx)} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-3 py-4">
                          <span className={`text-sm font-black ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-slate-500"}`}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-semibold text-white">{coord.coordinatorName}</div>
                          <div className="text-xs text-slate-500">{coord.coordinatorPhone}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-slate-300">#{coord.boothNumber}</div>
                          <div className="text-xs text-slate-500 max-w-[120px] truncate">{coord.pollingStationName}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full ${PERF_BAR_COLOR(coord.performanceScore)} transition-all duration-700`} style={{ width: `${coord.performanceScore}%` }} />
                            </div>
                            <span className="text-white font-bold text-xs">{coord.performanceScore}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${(HEALTH_COLOR[coord.performanceRating] || HEALTH_COLOR["Critical"]).badge}`}>
                            {coord.performanceRating}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-1">
                            {coord.flags?.slice(0, 3).map((flag, i) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-4">No coordinator activity data available.</p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              PHASE 1 CONTINUED — Charts, Quick Actions, Recent Activity
          ═══════════════════════════════════════════════════════════════════ */}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "📝", label: "Create Election" },
                { icon: "🏪", label: "Create Booth" },
                { icon: "➕", label: "Add User" },
              ].map(({ icon, label }) => (
                <button key={label} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-200 font-semibold group">
                  <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Turnout Trend Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Hourly Turnout Trend</h2>
                <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full">Live</span>
              </div>
              {charts.turnoutTrend?.length > 0 ? (
                <div className="h-72 relative flex items-end justify-between gap-2 p-4 bg-slate-800/20 rounded-xl border border-slate-800/50">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-4 text-xs text-slate-600">
                    <div className="border-t border-slate-700" /><div className="border-t border-slate-700" />
                    <div className="border-t border-slate-700" /><div className="border-t border-slate-700" />
                  </div>
                  {charts.turnoutTrend.map((trend) => (
                    <div key={trend.hour} className="flex-1 flex flex-col items-center gap-3 group relative">
                      <div className="w-full h-full flex items-end justify-center">
                        <div
                          style={{ height: `${Math.max(trend.averagePercentage, 5)}%` }}
                          className="w-full max-w-[20px] rounded-t-2xl bg-gradient-to-t from-indigo-600 to-blue-500 group-hover:from-indigo-500 group-hover:to-blue-400 shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {trend.hour > 12 ? `${trend.hour - 12}PM` : `${trend.hour}AM`}
                      </span>
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-slate-950 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap transition-opacity pointer-events-none">
                        {trend.averagePercentage}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center bg-slate-800/20 rounded-xl border border-slate-800/50 text-slate-500">
                  No turnout data available yet
                </div>
              )}
            </div>

            {/* Issue & Activity Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur space-y-6">
              <div>
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><span>📋</span> Issue Status</h3>
                <div className="space-y-3">
                  {[
                    { label: "Open Issues", value: charts.issueStatusDistribution.OPEN, color: "bg-rose-500" },
                    { label: "In Progress", value: charts.issueStatusDistribution.IN_PROGRESS || 0, color: "bg-amber-500" },
                    { label: "Resolved", value: charts.issueStatusDistribution.RESOLVED, color: "bg-emerald-500" },
                  ].map((issue, idx) => {
                    const total = overview.openIssues + overview.resolvedIssues + (charts.issueStatusDistribution.IN_PROGRESS || 0);
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                          <span>{issue.label}</span><span>{issue.value}</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div style={{ width: `${total > 0 ? (issue.value / total) * 100 : 0}%` }} className={`h-full ${issue.color} transition-all duration-500`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><span>⚡</span> Activity Progress</h3>
                <div className="space-y-4">
                  {[
                    { label: "Arrivals", current: charts.activityProgress.arrivedCoordinators, total: charts.activityProgress.totalCoordinators, color: "bg-indigo-500" },
                    { label: "Polling Started", current: charts.activityProgress.pollingStarted, total: charts.activityProgress.totalCoordinators, color: "bg-emerald-500" },
                  ].map((activity, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                        <span>{activity.label}</span><span>{activity.current} / {activity.total}</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div style={{ width: `${activity.total > 0 ? (activity.current / activity.total) * 100 : 0}%` }} className={`h-full ${activity.color} transition-all duration-500`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities & Issues */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span>📋</span> Recent Activities</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Booth</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Coordinator</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentActivities?.slice(0, 5).map((act) => (
                      <tr key={act._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-white">#{act.boothId?.boothNumber}</div>
                          <div className="text-xs text-slate-500">{act.boothId?.pollingStationName}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-white">{act.coordinatorId?.name}</div>
                          <div className="text-xs text-slate-500">{act.coordinatorId?.mobileNumber}</div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${act.evmStatus === "WORKING" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                            {act.evmStatus === "WORKING" ? "✓ Working" : "⚠ Issue"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!recentActivities || recentActivities.length === 0) && (
                      <tr><td colSpan="3" className="px-3 py-8 text-center text-slate-500">No activity logs yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span>🔔</span> Recent Issues</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Booth</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Issue</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentIssues?.slice(0, 5).map((issue) => (
                      <tr key={issue._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-white">#{issue.boothId?.boothNumber}</div>
                          <div className="text-xs text-slate-500">{issue.boothId?.constituency}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-medium text-white line-clamp-1">{issue.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{issue.description}</div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            issue.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400" :
                            issue.status === "IN_PROGRESS" ? "bg-amber-500/10 text-amber-400" :
                            "bg-rose-500/10 text-rose-400"
                          }`}>
                            {issue.status === "RESOLVED" ? "✓" : issue.status === "IN_PROGRESS" ? "⏳" : "🔴"} {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!recentIssues || recentIssues.length === 0) && (
                      <tr><td colSpan="3" className="px-3 py-8 text-center text-slate-500">No issues reported</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500 py-6">
            Last updated: {new Date().toLocaleTimeString()} • Data refreshes automatically
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;