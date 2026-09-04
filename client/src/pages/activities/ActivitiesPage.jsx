import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { getActivities } from "../../services/activity.service";

const ACTION_LABEL = {
  CHECK_IN:        { label: "✅ Checked In",            color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  EVM_WORKING:     { label: "🟢 EVM Working",           color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  EVM_NOT_WORKING: { label: "🔴 EVM Not Working",       color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  POLLING_STARTED: { label: "🗳️ Polling Started",       color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  REMARKS_UPDATE:  { label: "📝 Remarks Updated",       color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

const getActionBadge = (action) => {
  if (!action) return ACTION_LABEL.REMARKS_UPDATE;
  const parts = action.split("+");
  if (parts.length === 1) return ACTION_LABEL[action] || { label: action, color: "bg-slate-800 text-slate-400 border-slate-700" };
  const labels = parts.map((p) => ACTION_LABEL[p]?.label || p).join(", ");
  return { label: labels, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" };
};

function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await getActivities();
      setActivities(data.activities || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten activity documents into time-sorted rows
  // Each activity doc contributes one row per updateHistory entry
  const timelineRows = activities
    .flatMap((activity) => {
      const coordinator = activity.coordinatorId?.name || "—";
      const booth = activity.boothId?.boothNumber ? `Booth #${activity.boothId.boothNumber}` : "—";
      const boothName = activity.boothId?.pollingStationName || "";
      const election = activity.electionId?.name || "—";

      const history = activity.updateHistory || [];
      if (history.length === 0) {
        // Fallback: show a single row based on activity fields
        return [{
          coordinatorId: activity._id + "_base",
          coordinator,
          booth,
          boothName,
          election,
          action: activity.arrivedAtBooth ? "CHECK_IN" : null,
          timestamp: activity.arrivalTime || activity.createdAt,
          evmStatus: activity.evmStatus,
          pollingStarted: activity.pollingStarted,
          remarks: activity.remarks,
        }];
      }
      return history.map((h, idx) => ({
        coordinatorId: activity._id + "_" + idx,
        coordinator,
        booth,
        boothName,
        election,
        action: h.action,
        timestamp: h.timestamp,
        evmStatus: h.evmStatus || activity.evmStatus,
        pollingStarted: h.pollingStarted,
        remarks: h.remarks,
      }));
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Activities</h1>
              <p className="text-slate-400 mt-2">
                Time-wise log of all coordinator actions during today's election (6:00 AM – 7:00 PM)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 bg-slate-800/70 border border-slate-700 px-3 py-1.5 rounded-full">
                {timelineRows.length} action{timelineRows.length !== 1 ? "s" : ""} today
              </span>
              <button
                onClick={fetchActivities}
                className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-semibold transition"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* Summary Badges */}
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {activities.map((act) => (
                <div
                  key={act._id}
                  className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1.5"
                >
                  <span className={`h-2 w-2 rounded-full ${act.arrivedAtBooth ? "bg-emerald-500" : "bg-slate-600"}`} />
                  <span className="text-xs font-semibold text-slate-300">
                    {act.coordinatorId?.name || "—"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {act.boothId?.boothNumber ? `B#${act.boothId.boothNumber}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Timeline Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold tracking-wide">
                  <tr>
                    <th className="px-5 py-4">Time</th>
                    <th className="px-5 py-4">Coordinator</th>
                    <th className="px-5 py-4">Booth</th>
                    <th className="px-5 py-4">Election</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">EVM</th>
                    <th className="px-5 py-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading && (
                    <tr>
                      <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && timelineRows.map((row) => {
                    const badge = getActionBadge(row.action);
                    return (
                      <tr key={row.coordinatorId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-indigo-300 whitespace-nowrap">
                          {new Date(row.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-200">
                          {row.coordinator}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          <div>{row.booth}</div>
                          {row.boothName && <div className="text-[10px] text-slate-600 truncate max-w-[140px]">{row.boothName}</div>}
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs">
                          {row.election}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {row.evmStatus ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              row.evmStatus === "WORKING"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {row.evmStatus}
                            </span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-xs max-w-[180px] truncate">
                          {row.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && timelineRows.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                        <div className="text-3xl mb-2">📋</div>
                        <p className="font-semibold text-slate-400">No activities recorded today</p>
                        <p className="text-xs mt-1">Activities will appear here once coordinators check in (6:00 AM – 7:00 PM)</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default ActivitiesPage;