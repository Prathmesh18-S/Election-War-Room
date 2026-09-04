import { Link, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

function Sidebar() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getRoleBadgeStyle = (role) => {
    const styles = {
      SUPER_ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      PARTY_ADMIN: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      SECTOR_OFFICER: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      BOOTH_COORDINATOR: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
    };
    return styles[role] || "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  };

  const getLinkClass = (path) =>
    location.pathname === path
      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
      : "text-slate-300 hover:text-white hover:bg-slate-800/50";

  const linkBase = isCollapsed
    ? "flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-300 group relative"
    : "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300";

  const menuItems = {
    SUPER_ADMIN: [
      { path: "/super-admin-dashboard", icon: "📊", label: "Dashboard" }
    ],
    PARTY_ADMIN: [
      { path: "/dashboard", icon: "📈", label: "Dashboard" },
      { path: "/users", icon: "👥", label: "Users" },
      { path: "/elections", icon: "🗳️", label: "Elections" },
      { path: "/booths", icon: "🏢", label: "Booths" },
      { path: "/turnout", icon: "⏱️", label: "Turnout" },
      { path: "/issues", icon: "🐞", label: "Issues" },
      { path: "/activities", icon: "⚡", label: "Activities" }
    ],
    SECTOR_OFFICER: [
      { path: "/sector-dashboard", icon: "📊", label: "Dashboard" },
      { path: "/turnout", icon: "⏱️", label: "Turnout" },
      { path: "/issues", icon: "🐞", label: "Issues" },
      { path: "/activities", icon: "⚡", label: "Activities" }
    ],
    BOOTH_COORDINATOR: [
      { path: "/coordinator-dashboard", icon: "📋", label: "Dashboard" },
      { path: "/activities", icon: "⚡", label: "Activity" }
    ]
  };

  const roleMenuItems = menuItems[user?.role] || [];

  return (
    <aside className={`min-h-screen bg-slate-950 text-slate-100 hidden xl:flex flex-col border-r border-slate-800 transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isCollapsed ? "px-3" : "px-6"} py-6 border-b border-slate-800`}>
        {!isCollapsed && (
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Election War Room</p>
            <h2 className="mt-2 text-lg font-bold text-white">Control</h2>
          </div>
        )}
        {isCollapsed && <p className="text-sm font-bold">⚡</p>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors duration-200"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* User Profile Card */}
      <div className={`${isCollapsed ? "px-3" : "px-6"} py-6 border-b border-slate-800`}>
        <div className={`rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur ${isCollapsed ? "p-3 flex justify-center" : "p-4"}`}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{user?.name || "Admin"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user?.role?.replace(/_/g, " ")}</p>
                </div>
              </div>
              <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full ${getRoleBadgeStyle(user?.role)}`}>
                {user?.role === "SUPER_ADMIN" && "👑 Super Admin"}
                {user?.role === "PARTY_ADMIN" && "🎯 Party Admin"}
                {user?.role === "SECTOR_OFFICER" && "📍 Sector Officer"}
                {user?.role === "BOOTH_COORDINATOR" && "🏪 Coordinator"}
              </span>
            </>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} py-6 space-y-2 overflow-y-auto`}>
        {roleMenuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${linkBase} ${getLinkClass(item.path)}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                {item.label}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* Live Status Footer */}
      <div className={`${isCollapsed ? "px-3" : "px-6"} py-4 border-t border-slate-800 bg-slate-900/30`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20`}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          {!isCollapsed && <span className="text-xs font-medium text-emerald-300">Live</span>}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
