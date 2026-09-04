import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { getCoordinatorDashboard } from "../../services/coordinator.service";
import { startActivity, updateActivity } from "../../services/activity.service";
import { submitTurnout } from "../../services/turnout.service";
import { createIssue } from "../../services/issue.service";

// Turnout hour slot validation (within 1 hr window)
const isHourAllowed = (hourNum) => {
  const now = new Date();
  const slotDate = new Date(now);
  slotDate.setHours(hourNum, 0, 0, 0);
  const diffMs = now - slotDate;
  return diffMs >= 0 && diffMs <= 60 * 60 * 1000;
};

const getAnyHourAllowed = () => {
  return [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].some(isHourAllowed);
};

// Election operating hours guard (7 AM – 7 PM)
const isWithinElectionHours = () => {
  const h = new Date().getHours();
  return h >= 7 && h < 19;
};

const ACTION_LABEL = {
  CHECK_IN: { label: "✅ Checked In", color: "text-emerald-400" },
  EVM_WORKING: { label: "🟢 EVM Marked Working", color: "text-emerald-400" },
  EVM_NOT_WORKING: { label: "🔴 EVM Marked Not Working", color: "text-rose-400" },
  POLLING_STARTED: { label: "🗳️ Polling Started", color: "text-indigo-400" },
  REMARKS_UPDATE: { label: "📝 Remarks Updated", color: "text-amber-400" },
};

const getActionInfo = (action) => {
  if (!action) return { label: "Updated", color: "text-slate-400" };
  // Handle combined actions like "EVM_WORKING+POLLING_STARTED"
  const parts = action.split("+");
  if (parts.length === 1) return ACTION_LABEL[action] || { label: action, color: "text-slate-400" };
  return {
    label: parts.map((p) => ACTION_LABEL[p]?.label || p).join(", "),
    color: "text-indigo-400",
  };
};

function CoordinatorDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isTurnoutModalOpen, setIsTurnoutModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Form states
  const [checkInRemarks, setCheckInRemarks] = useState("");
  const [updateForm, setUpdateForm] = useState({
    evmStatus: "WORKING",
    pollingStarted: false,
    remarks: "",
  });

  const [turnoutForm, setTurnoutForm] = useState({
    reportHour: "",
    totalVotesCast: "",
  });

  const [issueForm, setIssueForm] = useState({
    issueType: "TECHNICAL_ISSUE",
    title: "",
    description: "",
  });

  const fetchCoordinatorData = async () => {
    try {
      setLoading(true);
      const res = await getCoordinatorDashboard();
      if (res.success) {
        setData(res.dashboard);
        if (res.dashboard.todaysActivity) {
          setUpdateForm({
            evmStatus: res.dashboard.todaysActivity.evmStatus,
            pollingStarted: res.dashboard.todaysActivity.pollingStarted,
            remarks: res.dashboard.todaysActivity.remarks || "",
          });
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load Coordinator dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinatorData();
  }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!data?.assignedBooth) return alert("No booth assigned to you");

    // Fetch geolocation if available
    let locationData = { latitude: null, longitude: null };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          locationData.latitude = position.coords.latitude;
          locationData.longitude = position.coords.longitude;
          await sendCheckIn(locationData);
        },
        async () => {
          await sendCheckIn(locationData);
        }
      );
    } else {
      await sendCheckIn(locationData);
    }
  };

  const sendCheckIn = async (location) => {
    try {
      await startActivity({
        electionId: data.assignedElection._id,
        boothId: data.assignedBooth._id,
        remarks: checkInRemarks,
        currentLocation: location,
      });
      alert("Check-in submitted successfully");
      setIsCheckInModalOpen(false);
      setCheckInRemarks("");
      fetchCoordinatorData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to check-in");
    }
  };

  const handleUpdateActivity = async (e) => {
    e.preventDefault();
    if (!data?.todaysActivity?._id) return alert("Please check-in first");

    let locationData = { latitude: null, longitude: null };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          locationData.latitude = position.coords.latitude;
          locationData.longitude = position.coords.longitude;
          await sendUpdate(locationData);
        },
        async () => {
          await sendUpdate(locationData);
        }
      );
    } else {
      await sendUpdate(locationData);
    }
  };

  const sendUpdate = async (location) => {
    try {
      await updateActivity(data.todaysActivity._id, {
        evmStatus: updateForm.evmStatus,
        pollingStarted: updateForm.pollingStarted,
        remarks: updateForm.remarks,
        currentLocation: location,
      });
      alert("Activity details updated successfully");
      setIsUpdateModalOpen(false);
      fetchCoordinatorData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update activity");
    }
  };

  const handleSubmitTurnoutReport = async (e) => {
    e.preventDefault();
    if (!data?.assignedBooth) return;

    if (Number(turnoutForm.totalVotesCast) > data.assignedBooth.totalRegisteredVoters) {
      return alert("Votes cast cannot exceed total registered voters (" + data.assignedBooth.totalRegisteredVoters + ")");
    }

    try {
      await submitTurnout({
        electionId: data.assignedElection._id,
        boothId: data.assignedBooth._id,
        reportHour: Number(turnoutForm.reportHour),
        totalVotesCast: Number(turnoutForm.totalVotesCast),
      });
      alert("Turnout report submitted successfully");
      setIsTurnoutModalOpen(false);
      setTurnoutForm({ reportHour: "", totalVotesCast: "" });
      fetchCoordinatorData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit turnout");
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!data?.assignedBooth) return;

    try {
      await createIssue({
        electionId: data.assignedElection._id,
        boothId: data.assignedBooth._id,
        issueType: issueForm.issueType,
        title: issueForm.title,
        description: issueForm.description,
      });
      alert("Issue reported successfully to the War Room");
      setIsIssueModalOpen(false);
      setIssueForm({ issueType: "TECHNICAL_ISSUE", title: "", description: "" });
      fetchCoordinatorData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to report issue");
    }
  };

  if (loading && !data) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </MainLayout>
    );
  }

  const hasArrived = !!data?.todaysActivity;
  const isPolling = data?.pollingStarted || false;

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800/80 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                Booth Field Work
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {data?.assignedBooth ? `Booth #${data.assignedBooth.boothNumber}` : "No Assigned Booth"}
              </h1>
              {data?.assignedBooth ? (
                <p className="text-slate-300 text-sm font-medium">
                  {data.assignedBooth.pollingStationName} &bull; {data.assignedBooth.constituency}, {data.assignedBooth.district}
                </p>
              ) : (
                <p className="text-slate-300 text-sm">Please contact your Party Admin to assign a booth to you.</p>
              )}
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-4">
              <span className="text-9xl font-black">#</span>
            </div>
          </div>

          {/* Assigned Election Card */}
          {data?.assignedElection && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Election</span>
                <span className="text-base font-bold text-slate-100 mt-1 block">{data.assignedElection.name}</span>
              </div>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
                {data.assignedElection.type}
              </span>
            </div>
          )}

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Arrival Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Check-In Status</span>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${hasArrived ? "bg-emerald-500" : "bg-slate-500 animate-pulse"}`} />
                  <span className="text-lg font-bold text-slate-100">{hasArrived ? "Checked In" : "Not Arrived"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {hasArrived
                    ? `Reached at ${new Date(data.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Check-in once you reach the polling booth station."}
                </p>
              </div>
              {!hasArrived && data?.assignedBooth && (
                isWithinElectionHours() ? (
                  <button
                    onClick={() => setIsCheckInModalOpen(true)}
                    className="w-full mt-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                  >
                    Perform Check-In
                  </button>
                ) : (
                  <div className="w-full mt-5 py-2.5 bg-slate-800/50 text-slate-500 rounded-xl text-sm font-semibold text-center border border-slate-700 cursor-not-allowed select-none">
                    🔒 Check-in closed (7AM–7PM only)
                  </div>
                )
              )}
            </div>

            {/* Polling Status */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Polling Status</span>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${isPolling ? "bg-emerald-500 animate-pulse" : "bg-slate-500"}`} />
                  <span className="text-lg font-bold text-slate-100">{isPolling ? "Polling Running" : "Not Started"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  EVM: <span className="font-semibold text-slate-300">{data?.evmStatus || "WORKING"}</span>
                </p>
              </div>
              {hasArrived && (
                isWithinElectionHours() ? (
                  <button
                    onClick={() => setIsUpdateModalOpen(true)}
                    className="w-full mt-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Update Polling/EVM
                  </button>
                ) : (
                  <div className="w-full mt-5 py-2.5 bg-slate-800/50 text-slate-500 rounded-xl text-sm font-semibold text-center border border-slate-700 cursor-not-allowed select-none">
                    🔒 Updates closed (7AM–7PM only)
                  </div>
                )
              )}
            </div>

            {/* Summary counters */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Day Activity Summary</span>
                <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-2xl font-bold text-slate-100">{data?.turnoutReportsSubmitted || 0}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">Turnouts</span>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                    <span className="text-2xl font-bold text-slate-100">{data?.reportedIssues || 0}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1">Issues</span>
                  </div>
                </div>
              </div>
              {data?.assignedBooth && (
                isWithinElectionHours() ? (
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => {
                        if (!getAnyHourAllowed()) {
                          alert("Turnout submission is only allowed during election hours (7:00 AM to 6:00 PM) and within 1 hour window.");
                          return;
                        }
                        setIsTurnoutModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold text-center transition"
                    >
                      Submit Turnout
                    </button>
                    <button
                      onClick={() => setIsIssueModalOpen(true)}
                      className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold text-center transition"
                    >
                      Report Issue
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 py-2.5 bg-slate-800/50 text-slate-500 rounded-xl text-xs font-semibold text-center border border-slate-700 select-none">
                    🔒 Submissions closed — Election hours: 7:00 AM to 7:00 PM
                  </div>
                )
              )}
            </div>

          </div>

          {/* ── Activity Timeline ───────────────────── */}
          {(data?.activityTimeline?.length > 0) && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl">⏱️</span>
                <div>
                  <h2 className="text-base font-bold text-white">My Activity Today</h2>
                  <p className="text-xs text-slate-400">Time-wise log of your actions at this booth</p>
                </div>
              </div>
              <ol className="relative border-l border-slate-700 space-y-5 ml-3">
                {[...data.activityTimeline].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((entry, i) => {
                  const info = getActionInfo(entry.action);
                  return (
                    <li key={i} className="ml-5">
                      <span className="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full bg-slate-800 border border-slate-600 ring-2 ring-slate-950" />
                      <div className="flex items-start justify-between">
                        <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
                        <span className="text-[11px] text-slate-500 ml-4 shrink-0">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      {entry.remarks && entry.action !== "CHECK_IN" && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">&quot;{entry.remarks}&quot;</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

        </div>
      </div>

      {/* CHECK-IN MODAL */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 bg-indigo-600/10 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold text-indigo-400">Check-In Arrival</h3>
              <button onClick={() => setIsCheckInModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleCheckIn} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Check-in Remarks</label>
                <textarea
                  placeholder="e.g. Arrived safely, booth setup is ready"
                  rows="3"
                  value={checkInRemarks}
                  onChange={(e) => setCheckInRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>
              <p className="text-[11px] text-slate-500">Note: Your current GPS coordinates will be logged dynamically with check-in.</p>
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Confirm Arrival
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Update Booth Polling Activity</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateActivity} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">EVM Working Status</label>
                <select
                  value={updateForm.evmStatus}
                  onChange={(e) => setUpdateForm({ ...updateForm, evmStatus: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="WORKING">Working (Working Smoothly)</option>
                  <option value="NOT_WORKING">Not Working (Technical Issue)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                <input
                  type="checkbox"
                  id="pollingStarted"
                  checked={updateForm.pollingStarted}
                  onChange={(e) => setUpdateForm({ ...updateForm, pollingStarted: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-600 rounded bg-slate-900"
                />
                <label htmlFor="pollingStarted" className="text-sm font-semibold text-slate-300 select-none">
                  Polling Has Started
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Remarks</label>
                <textarea
                  placeholder="Update any details or observation remarks"
                  rows="3"
                  value={updateForm.remarks}
                  onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Save Activity Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMIT TURNOUT MODAL */}
      {isTurnoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 bg-indigo-600/10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-indigo-400">Submit Hourly Turnout</h3>
                <p className="text-slate-400 text-xs mt-1">Booth Registered Voters: {data?.assignedBooth?.totalRegisteredVoters}</p>
              </div>
              <button onClick={() => setIsTurnoutModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitTurnoutReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Hour</label>
                <select
                  required
                  value={turnoutForm.reportHour}
                  onChange={(e) => setTurnoutForm({ ...turnoutForm, reportHour: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="">Choose Hour</option>
                  {isHourAllowed(7) && <option value="7">7:00 AM</option>}
                  {isHourAllowed(8) && <option value="8">8:00 AM</option>}
                  {isHourAllowed(9) && <option value="9">9:00 AM</option>}
                  {isHourAllowed(10) && <option value="10">10:00 AM</option>}
                  {isHourAllowed(11) && <option value="11">11:00 AM</option>}
                  {isHourAllowed(12) && <option value="12">12:00 PM</option>}
                  {isHourAllowed(13) && <option value="13">1:00 PM</option>}
                  {isHourAllowed(14) && <option value="14">2:00 PM</option>}
                  {isHourAllowed(15) && <option value="15">3:00 PM</option>}
                  {isHourAllowed(16) && <option value="16">4:00 PM</option>}
                  {isHourAllowed(17) && <option value="17">5:00 PM</option>}
                  {isHourAllowed(18) && <option value="18">6:00 PM</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Total Votes Cast Till Now</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Cumulative count of votes"
                  value={turnoutForm.totalVotesCast}
                  onChange={(e) => setTurnoutForm({ ...turnoutForm, totalVotesCast: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTurnoutModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT ISSUE MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-slate-800 bg-rose-600/10 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold text-rose-400">Report Issue to War Room</h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleReportIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Issue Category</label>
                <select
                  value={issueForm.issueType}
                  onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="EVM_ISSUE">EVM Issue (Technical / Machine Failure)</option>
                  <option value="LAW_AND_ORDER">Law & Order Incident</option>
                  <option value="OPPOSITION_OBJECTION">Opposition Party Objection</option>
                  <option value="VOTER_ISSUE">Voter Listing / Identity Issue</option>
                  <option value="POLLING_STAFF_ISSUE">Polling Staff Problems</option>
                  <option value="TECHNICAL_ISSUE">Other Technical Issue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EVM display not working"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Description / Details</label>
                <textarea
                  required
                  placeholder="Provide precise details of the issue for the war room team"
                  rows="4"
                  value={issueForm.description}
                  onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-rose-500/20 transition-all"
                >
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default CoordinatorDashboardPage;