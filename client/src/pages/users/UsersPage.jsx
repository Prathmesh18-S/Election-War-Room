import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  getUsers,
  createSectorOfficer,
  createBoothCoordinator,
  updateUser,
} from "../../services/user.service";
import { getElections } from "../../services/election.service";
import { getBooths } from "../../services/booth.service";

const defaultForm = {
  name: "",
  mobileNumber: "",
  email: "",
  password: "",
  role: "BOOTH_COORDINATOR",
  assignedElection: "",
  assignedBooth: "",
};

const ITEMS_PER_PAGE = 10;

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [elections, setElections] = useState([]);
  const [booths, setBooths] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [editingUser, setEditingUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchElections();
    fetchBooths();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.users);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchElections = async () => {
    try {
      const data = await getElections();
      setElections(data.elections);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBooths = async () => {
    try {
      const data = await getBooths();
      setBooths(data.booths);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingUser(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return alert("Name is required.");
    }
    if (!formData.mobileNumber.trim()) {
      return alert("Mobile number is required.");
    }
    if (!editingUser && !formData.password.trim()) {
      return alert("Password is required for new users.");
    }

    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          role: formData.role,
          assignedElection: formData.assignedElection || undefined,
          assignedBooth: formData.assignedBooth || undefined,
        };

        await updateUser(editingUser._id, payload);
        alert("User updated successfully.");
      } else {
        if (formData.role === "SECTOR_OFFICER") {
          await createSectorOfficer(formData);
        } else {
          await createBoothCoordinator(formData);
        }
        alert("User created successfully.");
      }

      resetForm();
      closeModal();
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save user");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      mobileNumber: user.mobileNumber || "",
      email: user.email || "",
      password: "",
      role: user.role || "BOOTH_COORDINATOR",
      assignedElection: user.assignedElection?._id || "",
      assignedBooth: user.assignedBooth?._id || "",
    });
    setShowModal(true);
    setActionMenuOpen(null);
  };

  // Filter and search logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobileNumber?.includes(searchQuery);
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getRoleBadgeStyle = (role) => {
    const styles = {
      SUPER_ADMIN: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
      PARTY_ADMIN: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
      SECTOR_OFFICER: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
      BOOTH_COORDINATOR: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
    };
    return styles[role] || "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  };

  const getRoleBadgeLabel = (role) => {
    const labels = {
      SUPER_ADMIN: "👑 Super Admin",
      PARTY_ADMIN: "🎯 Party Admin",
      SECTOR_OFFICER: "📍 Sector Officer",
      BOOTH_COORDINATOR: "🏪 Coordinator"
    };
    return labels[role] || role;
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Users Management</h1>
              <p className="text-slate-400 mt-2">Manage sector officers and booth coordinators</p>
            </div>
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20"
            >
              <span className="mr-2">➕</span> Add User
            </button>
          </div>

          {/* Search and Filters */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="flex-1 relative">
                <span className="absolute left-3 top-3 text-slate-400">🔍</span>
                <input
                  type="search"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="ALL">All Roles</option>
                <option value="SECTOR_OFFICER">Sector Officer</option>
                <option value="BOOTH_COORDINATOR">Booth Coordinator</option>
              </select>

              {/* Result Count */}
              <div className="text-sm text-slate-400">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
            {paginatedUsers.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/50">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Email</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Role</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Election</th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Booth</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {paginatedUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{user.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 hidden md:table-cell">{user.email || "—"}</td>
                          <td className="px-6 py-4 text-slate-300">{user.mobileNumber}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full border ${getRoleBadgeStyle(user.role)}`}>
                              {getRoleBadgeLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 hidden lg:table-cell">
                            {user.assignedElection?.name || "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-300 hidden lg:table-cell">
                            {user.assignedBooth?.boothNumber ? `Booth #${user.assignedBooth.boothNumber}` : "—"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="relative inline-block">
                              <button
                                onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
                                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="More options"
                              >
                                ⋯
                              </button>
                              {actionMenuOpen === user._id && (
                                <div className="absolute right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-40 overflow-hidden">
                                  <button
                                    onClick={() => handleEdit(user)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                  >
                                    <span>✏️</span> Edit User
                                  </button>
                                  <button
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 flex items-center gap-2 transition-colors border-t border-slate-700"
                                  >
                                    <span>📋</span> View Details
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-800/20">
                    <div className="text-sm text-slate-400">
                      Page {currentPage} of {totalPages} • Showing {paginatedUsers.length} of {filteredUsers.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Prev
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg border transition-colors ${
                            currentPage === page
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-700 text-slate-300 hover:bg-slate-700/50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-slate-400 text-lg">No users found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingUser ? "Edit User" : "Create New User"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Name *</label>
                  <input
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Mobile Number *</label>
                  <input
                    placeholder="Phone number"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="SECTOR_OFFICER">Sector Officer</option>
                    <option value="BOOTH_COORDINATOR">Booth Coordinator</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Password {!editingUser && "*"}
                  </label>
                  <input
                    type="password"
                    placeholder={editingUser ? "Leave blank to keep password" : "Password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Assigned Election */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Assigned Election</label>
                  <select
                    value={formData.assignedElection}
                    onChange={(e) => setFormData({ ...formData, assignedElection: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">None</option>
                    {elections.map((election) => (
                      <option key={election._id} value={election._id}>
                        {election.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Assigned Booth */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Assigned Booth</label>
                  <select
                    value={formData.assignedBooth}
                    onChange={(e) => setFormData({ ...formData, assignedBooth: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  >
                    <option value="">None</option>
                    {booths.map((booth) => {
                      const isAssignedToOther = booth.assignedCoordinator &&
                        String(booth.assignedCoordinator._id || booth.assignedCoordinator) !== String(editingUser?._id || '');
                      return (
                        <option
                          key={booth._id}
                          value={booth._id}
                          disabled={isAssignedToOther}
                        >
                          Booth #{booth.boothNumber} — {booth.pollingStationName} {isAssignedToOther ? `(Assigned to ${booth.assignedCoordinator.name || 'another'})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default UsersPage;