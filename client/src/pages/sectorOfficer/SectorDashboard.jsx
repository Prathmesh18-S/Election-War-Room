import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { getSectorDashboard } from "../../services/sector.service";

function SectorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSectorData = async () => {
    try {
      setLoading(true);
      const res = await getSectorDashboard();
      if (res.success) {
        setData(res.dashboard);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load Sector Officer dashboard details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectorData();
  }, []);

  if (loading && !data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Sector Officer Supervision</h1>
            <p className="text-slate-400 mt-2">Supervise and monitor assigned booths, coordinators, turnout, and issues in real-time.</p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Assigned Booths</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-slate-100">{data?.assignedBooths?.length || 0}</span>
                <span className="text-xs text-slate-500">Booths</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Coordinators Active: {data?.activeCoordinators || 0}</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Polling Started</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-indigo-400">{data?.pollingStarted || 0}</span>
                <span className="text-xs text-indigo-500/50">
                  / {data?.assignedBooths?.length || 0}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Booths currently active</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Open Issues</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-3xl font-extrabold ${data?.openIssues > 0 ? "text-rose-400 animate-pulse" : "text-slate-100"}`}>
                  {data?.openIssues || 0}
                </span>
                <span className="text-xs text-slate-500">Open</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Awaiting admin action</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Votes Cast</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-emerald-400">{(data?.totalVotes || 0).toLocaleString()}</span>
                <span className="text-xs text-slate-500">Votes</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Total registered turnout reports</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Average Turnout</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-blue-400">{data?.averageTurnout || 0}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Average percentage of votes cast</p>
            </div>
          </div>

          {/* Assigned Booths status bar / grid */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Assigned Booths Status Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data?.assignedBooths?.map((booth) => (
                <div
                  key={booth._id}
                  className="p-3 rounded-lg border border-slate-700 bg-slate-800/30 flex flex-col justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Booth #{booth.boothNumber}</span>
                    <div className="font-semibold text-slate-200 text-sm truncate mt-0.5">{booth.pollingStationName}</div>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <span className="text-slate-500">{booth.constituency}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        booth.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
              {(!data?.assignedBooths || data?.assignedBooths.length === 0) && (
                <div className="col-span-full py-4 text-center text-slate-500 text-sm">No booths assigned to you yet.</div>
              )}
            </div>
          </div>

          {/* Supervision Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coordinator Activity Timeline */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white">Coordinator Activity Timeline</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Time-wise log of all coordinator actions today</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">Today</span>
              </div>

              {/* Per-coordinator expandable cards */}
              {data?.recentActivities?.length > 0 ? (
                <div className="space-y-4">
                  {data.recentActivities.map((act) => {
                    const history = act.updateHistory || [];
                    const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    return (
                      <div key={act._id} className="rounded-xl border border-slate-700 bg-slate-800/30 overflow-hidden">
                        {/* Coordinator header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
                          <div className="flex items-center gap-3">
                            <div className={`h-2.5 w-2.5 rounded-full ${act.arrivedAtBooth ? "bg-emerald-500" : "bg-slate-600"}`} />
                            <div>
                              <div className="font-semibold text-slate-200 text-sm">{act.coordinatorId?.name || "—"}</div>
                              <div className="text-[10px] text-slate-500">{act.coordinatorId?.mobileNumber}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-300">Booth #{act.boothId?.boothNumber}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{act.boothId?.pollingStationName}</div>
                          </div>
                        </div>
                        {/* Status badges row */}
                        <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-slate-700/30">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            act.arrivedAtBooth ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}>
                            {act.arrivedAtBooth ? `✅ Arrived ${act.arrivalTime ? new Date(act.arrivalTime).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : ""}` : "Not Arrived"}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            act.evmStatus === "WORKING" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            EVM: {act.evmStatus || "—"}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            act.pollingStarted ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}>
                            {act.pollingStarted ? `🗳️ Polling Started` : "Polling Pending"}
                          </span>
                        </div>
                        {/* Timeline entries */}
                        {sorted.length > 0 ? (
                          <ol className="relative border-l border-slate-700 ml-6 my-3 space-y-3 mr-4">
                            {sorted.map((entry, idx) => {
                              const ACTION_MAP = {
                                CHECK_IN: { label: "Checked In", color: "text-emerald-400" },
                                EVM_WORKING: { label: "EVM Marked Working", color: "text-emerald-400" },
                                EVM_NOT_WORKING: { label: "EVM Not Working ⚠️", color: "text-rose-400" },
                                POLLING_STARTED: { label: "Polling Started 🗳️", color: "text-indigo-400" },
                                REMARKS_UPDATE: { label: "Remarks Updated", color: "text-amber-400" },
                              };
                              const parts = (entry.action || "").split("+");
                              const label = parts.map(p => ACTION_MAP[p]?.label || p).join(" + ");
                              const color = ACTION_MAP[parts[0]]?.color || "text-slate-400";
                              return (
                                <li key={idx} className="ml-4">
                                  <span className="absolute -left-1.5 flex items-center justify-center w-3 h-3 rounded-full bg-slate-800 border border-slate-600" />
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-semibold ${color}`}>{label}</span>
                                    <span className="text-[10px] text-slate-500 font-mono ml-4 shrink-0">
                                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                    </span>
                                  </div>
                                  {entry.remarks && entry.action !== "CHECK_IN" && (
                                    <p className="text-[10px] text-slate-600 italic mt-0.5">"{entry.remarks}"</p>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        ) : (
                          <p className="text-[10px] text-slate-600 px-4 py-2 italic">No detailed history yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <div className="text-3xl mb-2">📋</div>
                  <p>No coordinator activities recorded today.</p>
                </div>
              )}
            </div>


            {/* Recent Turnout Submissions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white">Hourly Turnout</h3>
                <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Recent</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-3 px-4">Booth</th>
                      <th className="py-3 px-4 text-center">Hour</th>
                      <th className="py-3 px-4 text-right">Votes</th>
                      <th className="py-3 px-4 text-right">Turnout %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {data?.recentTurnout?.map((turn) => (
                      <tr key={turn._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-200">#{turn.boothId?.boothNumber}</div>
                          <div className="text-[10px] text-slate-500">{turn.boothId?.constituency}</div>
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-400">{turn.reportHour}:00</td>
                        <td className="py-4 px-4 text-right font-medium text-slate-200">{turn.totalVotesCast}</td>
                        <td className="py-4 px-4 text-right text-indigo-400 font-bold">{turn.turnoutPercentage}%</td>
                      </tr>
                    ))}
                    {(!data?.recentTurnout || data?.recentTurnout.length === 0) && (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-slate-500">No turnout reports today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Issues Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl lg:col-span-3 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white">Reported Issues</h3>
                <span className="text-xs font-semibold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">Needs Supervision</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-3 px-4">Booth</th>
                      <th className="py-3 px-4">Issue Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Reported By</th>
                      <th className="py-3 px-4 text-center">AI Priority</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {data?.recentIssues?.map((issue) => (
                      <tr key={issue._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-200">#{issue.boothId?.boothNumber}</div>
                          <div className="text-[10px] text-slate-500">{issue.boothId?.constituency}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-medium border border-slate-700">
                            {issue.issueType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-200">{issue.title}</div>
                          <div className="text-[10px] text-slate-500 line-clamp-1">{issue.description}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-slate-200">{issue.reportedBy?.name}</div>
                          <div className="text-[10px] text-slate-500">{issue.reportedBy?.mobileNumber}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {issue.aiPriority ? (
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                issue.aiPriority === "CRITICAL"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : issue.aiPriority === "HIGH"
                                  ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  : issue.aiPriority === "MEDIUM"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              {issue.aiPriority}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              issue.status === "RESOLVED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : issue.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                            }`}
                          >
                            {issue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(!data?.recentIssues || data?.recentIssues.length === 0) && (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">No issues reported in your sector.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default SectorDashboard;
