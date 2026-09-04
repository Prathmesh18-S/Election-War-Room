import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(3);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const getRoleColor = (role) => {
    const colors = {
      SUPER_ADMIN: "from-purple-600 to-purple-700",
      PARTY_ADMIN: "from-blue-600 to-indigo-700",
      SECTOR_OFFICER: "from-indigo-600 to-indigo-700",
      BOOTH_COORDINATOR: "from-emerald-600 to-teal-700"
    };
    return colors[role] || "from-slate-600 to-slate-700";
  };

  const getElectionStatus = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 18) {
      return { status: "🟢 Live", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    } else if (hour >= 18 && hour < 22) {
      return { status: "🟡 Counting", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    }
    return { status: "🔴 Closed", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
  };

  const electionStatus = getElectionStatus();

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/95 border-b border-slate-800/50 shadow-lg backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          {/* Top Row */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left Side - Organization & Status */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              {/* Organization Name */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-lg">
                  ⚡
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Organization</p>
                  <p className="text-sm font-bold text-white">Election Commission</p>
                </div>
              </div>

              {/* Election Status */}
              <div className={`px-3 py-2 rounded-lg border ${electionStatus.color} text-xs font-semibold hidden md:inline-block`}>
                {electionStatus.status}
              </div>

              {/* Current Date */}
              <div className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/30 text-xs font-medium text-slate-300 hidden md:inline-block">
                📅 {currentDate}
              </div>
            </div>

            {/* Right Side - Search, Notifications, Profile */}
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/30 focus-within:border-indigo-500 focus-within:bg-slate-800/50 transition-all duration-200">
                <span className="text-slate-500">🔍</span>
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500 w-32"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors duration-200 group">
                <span className="text-lg">🔔</span>
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 shadow-lg z-40">
                  <p className="text-sm font-semibold text-white mb-3">📢 Recent Notifications</p>
                  <div className="space-y-2 text-xs text-slate-300">
                    <p className="p-2 rounded bg-slate-700/50 border border-slate-600">✅ Booth #12 status updated</p>
                    <p className="p-2 rounded bg-slate-700/50 border border-slate-600">⚠️ Issue reported at booth #5</p>
                    <p className="p-2 rounded bg-slate-700/50 border border-slate-600">📊 Turnout update available</p>
                  </div>
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors duration-200"
              >
                <span className="text-lg">⚙️</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 hover:border-indigo-600 hover:bg-slate-800/50 transition-all duration-200"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getRoleColor(user?.role)} flex items-center justify-center text-white text-xs font-bold`}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white">{user?.name || "Admin"}</p>
                    <p className="text-[10px] text-slate-400">{user?.role?.replace(/_/g, " ")}</p>
                  </div>
                  <span className={`text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`}>▼</span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{user?.email || "user@election.gov"}</p>
                      <p className="text-xs text-slate-500 mt-1.5 inline-block px-2 py-1 bg-slate-700 rounded">
                        {user?.role?.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => { setIsProfileModalOpen(true); setShowProfileDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                      >
                        <span>👤</span> My Profile
                      </button>
                      <button
                        onClick={() => { setIsSettingsModalOpen(true); setShowProfileDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                      >
                        <span>⚙️</span> Settings
                      </button>
                      <button
                        onClick={() => { setIsHelpModalOpen(true); setShowProfileDropdown(false); }}
                        className="w-full text-left px-3 py-2.5 rounded text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                      >
                        <span>❓</span> Help & Support
                      </button>
                    </div>

                    <div className="p-2 border-t border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2.5 rounded text-sm font-semibold text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Info Row */}
          <div className="flex gap-2 md:hidden text-xs mt-4">
            <span className={`px-2 py-1 rounded border ${electionStatus.color}`}>{electionStatus.status}</span>
            <span className="px-2 py-1 rounded border border-slate-700 bg-slate-800/30 text-slate-300">📅 {currentDate}</span>
          </div>
        </div>
      </header>

      {/* PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-700 relative">
            <div className="absolute top-4 right-4">
              <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-6 text-center border-b border-slate-800 bg-slate-800/30">
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${getRoleColor(user?.role)} flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg`}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-white">{user?.name}</h3>
              <p className="text-indigo-400 font-semibold mt-1 text-sm">{user?.role?.replace(/_/g, " ")}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Email</p>
                <p className="text-slate-200">{user?.email || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Mobile Number</p>
                <p className="text-slate-200">{user?.mobileNumber || "Not provided"}</p>
              </div>
              {user?.assignedBooth && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Assigned Booth</p>
                  <p className="text-slate-200">Booth #{user.assignedBooth.boothNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">⚙️ Settings</h3>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-200 font-medium">Dark Mode</p>
                  <p className="text-xs text-slate-500">System preference is automatically applied.</p>
                </div>
                <div className="w-12 h-6 bg-indigo-500 rounded-full relative cursor-not-allowed opacity-80">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-200 font-medium">Push Notifications</p>
                  <p className="text-xs text-slate-500">Receive alerts for new issues and turnout.</p>
                </div>
                <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-slate-400 rounded-full absolute left-1 top-1"></div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
                Advanced settings are managed by your Super Administrator. Please contact them if you need role changes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HELP & SUPPORT MODAL */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-700">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">❓ Help & Support</h3>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm">
                If you are experiencing any issues with the platform, please reach out to our dedicated support team.
              </p>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Email Support</p>
                <a href="mailto:support@election.gov" className="text-indigo-400 font-medium hover:underline">
                  support@election.gov
                </a>
              </div>
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Helpline</p>
                <p className="text-slate-200 font-medium">1800-111-2222</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
