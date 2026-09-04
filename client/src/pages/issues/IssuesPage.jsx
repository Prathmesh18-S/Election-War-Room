import {
  useEffect,
  useState,
  useContext,
} from "react";

import {
  AuthContext,
} from "../../context/AuthContext";

import MainLayout from "../../components/layout/MainLayout";

import {
  getIssues,
  createIssue,
  updateIssueStatus,
  retryAllIssuesAi,
  retryIssueAi,
} from "../../services/issue.service";

import {
  getElections,
} from "../../services/election.service";

import {
  getBooths,
} from "../../services/booth.service";

/* ───────────── helpers ───────────── */

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: "CRITICAL",
    bg: "bg-rose-500/15",
    text: "text-rose-400",
    border: "border-rose-500/40",
    dot: "bg-rose-400",
    glow: "shadow-rose-500/30",
    pulse: true,
  },
  HIGH: {
    label: "HIGH",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/40",
    dot: "bg-orange-400",
    glow: "shadow-orange-500/20",
    pulse: false,
  },
  MEDIUM: {
    label: "MEDIUM",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
    glow: "shadow-amber-500/20",
    pulse: false,
  },
  LOW: {
    label: "LOW",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
    glow: "shadow-emerald-500/10",
    pulse: false,
  },
};

const AIPriorityBadge = ({ priority }) => {
  if (!priority) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/40">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
        Analyzing…
      </span>
    );
  }

  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${cfg.bg} ${cfg.text} ${cfg.border} ${cfg.glow}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    IN_PROGRESS: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    OPEN: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || map.OPEN}`}>
      {status === "RESOLVED" ? "✓ " : status === "IN_PROGRESS" ? "⏳ " : "● "}
      {status.replace("_", " ")}
    </span>
  );
};

/* Renders bullet lines from aiSuggestedResolution */
const ResolutionSteps = ({ text }) => {
  if (!text) return <p className="text-slate-500 text-sm">No resolution steps available.</p>;

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const clean = line.replace(/^[-•*\d.]+\s*/, "").trim();
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            {clean}
          </li>
        );
      })}
    </ul>
  );
};

/* Expandable AI detail panel shown below a clicked row */
const AIDetailPanel = ({ issue, onClose }) => {
  const priorityCfg = PRIORITY_CONFIG[issue.aiPriority] || null;

  return (
    <tr>
      <td colSpan={9} className="px-0 py-0">
        <div className="mx-4 mb-4 mt-1 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 overflow-hidden shadow-xl shadow-indigo-500/5 animate-fade-in">
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  AI Analysis
                </p>
                <p className="text-white font-semibold text-sm mt-0.5">{issue.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all text-sm"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60">
            {/* AI Priority */}
            <div className="px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                AI Priority
              </p>
              {issue.aiPriority ? (
                <div className="space-y-3">
                  <AIPriorityBadge priority={issue.aiPriority} />
                  {priorityCfg && (
                    <p className={`text-xs ${priorityCfg.text} leading-relaxed`}>
                      {issue.aiPriority === "CRITICAL" && "⚠️ Immediate action required. Escalate to senior staff now."}
                      {issue.aiPriority === "HIGH" && "🔴 High-urgency issue. Assign a coordinator within 15 minutes."}
                      {issue.aiPriority === "MEDIUM" && "🟡 Moderate issue. Monitor and address within the hour."}
                      {issue.aiPriority === "LOW" && "🟢 Low-impact issue. Address when resources are available."}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span className="animate-spin">⏳</span>
                  <span>Gemini is analyzing…</span>
                </div>
              )}
            </div>

            {/* AI Summary */}
            <div className="px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                AI Summary
              </p>
              {issue.aiSummary ? (
                <p className="text-sm text-slate-300 leading-relaxed">{issue.aiSummary}</p>
              ) : (
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-full" />
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-5/6" />
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-4/6" />
                </div>
              )}
            </div>

            {/* AI Suggested Resolution */}
            <div className="px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Suggested Resolution
              </p>
              {issue.aiSuggestedResolution ? (
                <ResolutionSteps text={issue.aiSuggestedResolution} />
              ) : (
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-full" />
                  <div className="h-3 bg-slate-800 rounded animate-pulse w-3/4" />
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

/* ───────────── main component ───────────── */

function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [elections, setElections] = useState([]);
  const [booths, setBooths] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    electionId: "",
    boothId: "",
    issueType: "EVM_ISSUE",
    title: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  // Track which issue IDs are currently being re-analyzed
  const [retryingIds, setRetryingIds] = useState(new Set());
  const [retryingAll, setRetryingAll] = useState(false);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [issueData, electionData, boothData] = await Promise.all([
      getIssues(),
      getElections(),
      getBooths(),
    ]);
    setIssues(issueData.issues || []);
    setElections(electionData.elections || []);
    setBooths(boothData.booths || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createIssue(formData);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      fetchData();
      setFormData({ electionId: "", boothId: "", issueType: "EVM_ISSUE", title: "", description: "" });
    } catch (error) {
      alert(error.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (issueId, status) => {
    try {
      await updateIssueStatus(issueId, { status });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  /** Re-analyze a single issue that still has null AI fields */
  const handleRetrySingle = async (e, issueId) => {
    e.stopPropagation();
    setRetryingIds((prev) => new Set(prev).add(issueId));
    try {
      const data = await retryIssueAi(issueId);
      if (data.issue) {
        setIssues((prev) =>
          prev.map((i) => (i._id === issueId ? data.issue : i))
        );
      }
    } catch (err) {
      alert("AI retry failed: " + (err.response?.data?.message || err.message));
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(issueId);
        return next;
      });
    }
  };

  /** Re-analyze ALL issues that still have null AI fields */
  const handleRetryAll = async () => {
    setRetryingAll(true);
    try {
      await retryAllIssuesAi();
      await fetchData(); // refresh list after batch update
    } catch (err) {
      alert("Batch AI retry failed: " + (err.response?.data?.message || err.message));
    } finally {
      setRetryingAll(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const issueTypeLabels = {
    EVM_ISSUE: "EVM Issue",
    LAW_AND_ORDER: "Law & Order",
    OPPOSITION_OBJECTION: "Opposition Objection",
    VOTER_ISSUE: "Voter Issue",
    POLLING_STAFF_ISSUE: "Polling Staff",
    TECHNICAL_ISSUE: "Technical Issue",
  };

  return (
    <MainLayout>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Issues</h1>
              <p className="text-slate-400 mt-2">
                Report and track issues across booths — AI-powered triage included.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                🤖 AI Triage Active
              </span>
              {user?.role === "PARTY_ADMIN" && (
                <button
                  onClick={handleRetryAll}
                  disabled={retryingAll}
                  title="Re-run AI analysis on all issues that are still showing Analyzing…"
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition disabled:opacity-60"
                >
                  {retryingAll ? "⏳ Analyzing all…" : "🔄 Re-analyze All"}
                </button>
              )}
            </div>
          </div>

          {/* Report Issue Form (coordinators only) */}
          {user?.role === "BOOTH_COORDINATOR" && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur"
            >
              <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
                <span>📝</span> Report New Issue
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Election</label>
                  <select
                    value={formData.electionId}
                    onChange={(e) => setFormData({ ...formData, electionId: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="">Select Election</option>
                    {elections.map((el) => (
                      <option key={el._id} value={el._id}>{el.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Booth</label>
                  <select
                    value={formData.boothId}
                    onChange={(e) => setFormData({ ...formData, boothId: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="">Select Booth</option>
                    {booths.map((b) => (
                      <option key={b._id} value={b._id}>
                        Booth #{b.boothNumber} - {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Issue Type</label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="EVM_ISSUE">EVM Issue</option>
                    <option value="LAW_AND_ORDER">Law & Order</option>
                    <option value="OPPOSITION_OBJECTION">Opposition Objection</option>
                    <option value="VOTER_ISSUE">Voter Issue</option>
                    <option value="POLLING_STAFF_ISSUE">Polling Staff Issue</option>
                    <option value="TECHNICAL_ISSUE">Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Brief issue title"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows="3"
                    placeholder="Describe the issue in detail…"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>🤖</span>
                  AI will auto-assign priority, summary & resolution steps after submission.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20"
                >
                  {submitting ? (
                    <><span className="animate-spin">⏳</span> Submitting…</>
                  ) : submitSuccess ? (
                    <><span>✓</span> Reported!</>
                  ) : (
                    <>Report Issue</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 px-1">
            <span className="text-xs text-slate-500 font-medium">AI Priority:</span>
            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
              <span key={key} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/40">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              Analyzing
            </span>
            <span className="text-xs text-slate-600 ml-auto">
              💡 Click any row to view AI analysis
            </span>
          </div>

          {/* Issues Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold tracking-wide">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">AI Priority</th>
                    <th className="px-5 py-4 whitespace-nowrap">Type</th>
                    <th className="px-5 py-4 min-w-[180px]">Title</th>
                    <th className="px-5 py-4 min-w-[260px]">AI Summary / Description</th>
                    <th className="px-5 py-4 whitespace-nowrap">Booth</th>
                    <th className="px-5 py-4 whitespace-nowrap">Election</th>
                    <th className="px-5 py-4 whitespace-nowrap">Reporter</th>
                    <th className="px-5 py-4 whitespace-nowrap">Status</th>
                    {user?.role === "PARTY_ADMIN" && (
                      <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {issues.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-500">
                        No issues reported yet.
                      </td>
                    </tr>
                  )}
                  {issues.map((issue) => (
                    <>
                      <tr
                        key={issue._id}
                        onClick={() => toggleExpand(issue._id)}
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${expandedId === issue._id ? "bg-slate-800/20 border-l-2 border-l-indigo-500" : ""}`}
                      >
                        {/* AI Priority */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <AIPriorityBadge priority={issue.aiPriority} />
                            {/* Show retry button for issues still pending AI analysis */}
                            {!issue.aiPriority && user?.role === "PARTY_ADMIN" && (
                              <button
                                onClick={(e) => handleRetrySingle(e, issue._id)}
                                disabled={retryingIds.has(issue._id)}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition disabled:opacity-60 whitespace-nowrap"
                              >
                                {retryingIds.has(issue._id) ? "⏳…" : "🔄 Retry AI"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-slate-300 font-medium text-xs">
                            {issueTypeLabels[issue.issueType] || issue.issueType.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white line-clamp-1">{issue.title}</p>
                        </td>

                        {/* AI Summary / Description */}
                        <td className="px-5 py-4">
                          {issue.aiSummary ? (
                            <div>
                              <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{issue.aiSummary}</p>
                              <span className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-400 font-medium">
                                <span>🤖</span> AI Summary
                              </span>
                            </div>
                          ) : (
                            <p className="text-slate-400 text-xs line-clamp-2">{issue.description}</p>
                          )}
                        </td>

                        {/* Booth */}
                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">
                          {issue.boothId ? `#${issue.boothId.boothNumber}` : "—"}
                        </td>

                        {/* Election */}
                        <td className="px-5 py-4 text-slate-400 text-xs line-clamp-1">
                          {issue.electionId ? issue.electionId.name : "—"}
                        </td>

                        {/* Reporter */}
                        <td className="px-5 py-4 text-slate-400 whitespace-nowrap text-xs">
                          {issue.reportedBy ? issue.reportedBy.name : "—"}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={issue.status} />
                        </td>

                        {/* Actions */}
                        {user?.role === "PARTY_ADMIN" && (
                          <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {issue.status !== "IN_PROGRESS" && issue.status !== "RESOLVED" && (
                              <button
                                onClick={() => handleStatusUpdate(issue._id, "IN_PROGRESS")}
                                className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-semibold hover:bg-amber-500/20 transition"
                              >
                                Progress
                              </button>
                            )}
                            {issue.status !== "RESOLVED" && (
                              <button
                                onClick={() => handleStatusUpdate(issue._id, "RESOLVED")}
                                className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold hover:bg-emerald-500/20 transition"
                              >
                                Resolve
                              </button>
                            )}
                          </td>
                        )}
                      </tr>

                      {/* AI Detail Panel */}
                      {expandedId === issue._id && (
                        <AIDetailPanel
                          key={`panel-${issue._id}`}
                          issue={issue}
                          onClose={() => setExpandedId(null)}
                        />
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

export default IssuesPage;