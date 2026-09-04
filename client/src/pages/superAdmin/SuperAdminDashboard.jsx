import { useEffect, useState } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  getSuperAdminDashboard,
  createOrganization,
  updateOrganization,
  toggleOrganizationStatus,
  createPartyAdmin,
} from "../../services/superAdmin.service";

function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Form states
  const [orgForm, setOrgForm] = useState({
    name: "",
    type: "POLITICAL_PARTY",
    contactPerson: "",
    mobileNumber: "",
    subscriptionStatus: "TRIAL",
    aiTokens: 1000,
  });

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [planForm, setPlanForm] = useState({
    subscriptionStatus: "TRIAL",
    aiTokens: 1000,
  });

  const [adminForm, setAdminForm] = useState({
    name: "",
    mobileNumber: "",
    password: "",
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getSuperAdminDashboard();
      if (res.success) {
        setData(res.dashboard);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load Super Admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await createOrganization(orgForm);
      alert("Organization created successfully");
      setIsOrgModalOpen(false);
      setOrgForm({
        name: "",
        type: "POLITICAL_PARTY",
        contactPerson: "",
        mobileNumber: "",
        subscriptionStatus: "TRIAL",
        aiTokens: 1000,
      });
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create organization");
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      await updateOrganization(selectedOrg._id, planForm);
      alert("Organization plan updated successfully");
      setIsPlanModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update plan");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await createPartyAdmin(selectedOrg._id, adminForm);
      alert("Party Admin created successfully");
      setIsAdminModalOpen(false);
      setAdminForm({ name: "", mobileNumber: "", password: "" });
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create Party Admin");
    }
  };

  const handleToggleStatus = async (orgId) => {
    if (!confirm("Are you sure you want to toggle status?")) return;
    try {
      await toggleOrganizationStatus(orgId);
      alert("Status toggled successfully");
      fetchDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to toggle status");
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
              <p className="text-slate-400 mt-2">Manage global system organizations, plans, and token distribution.</p>
            </div>
            <button
              onClick={() => setIsOrgModalOpen(true)}
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              Create Organization
            </button>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-900/20 p-6 backdrop-blur shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Total Organizations</p>
                <p className="text-4xl font-extrabold text-white mt-2">{data?.totalOrganizations || 0}</p>
                <div className="flex items-center justify-between mt-4 text-indigo-300/70 text-xs">
                  <span>Active: {data?.activeOrganizations || 0}</span>
                  <span>Inactive: {data?.inactiveOrganizations || 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-900/20 p-6 backdrop-blur shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Subscription Split</p>
                <p className="text-4xl font-extrabold text-white mt-2">{data?.activeSubscriptionOrgs || 0} Active</p>
                <div className="flex items-center justify-between mt-4 text-emerald-300/70 text-xs">
                  <span>Trial: {data?.trialOrganizations || 0}</span>
                  <span>Expired: {data?.expiredOrganizations || 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-900/20 p-6 backdrop-blur shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider">AI Tokens Sum</p>
                <p className="text-4xl font-extrabold text-white mt-2">{(data?.totalTokensRemaining || 0).toLocaleString()}</p>
                <p className="text-xs text-blue-300/70 mt-4">Remaining system-wide tokens</p>
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-900/20 p-6 backdrop-blur shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-purple-400 text-sm font-semibold uppercase tracking-wider">Platform Hierarchy</p>
                <p className="text-3xl font-extrabold text-white mt-2">
                  {(data?.totalPartyAdmins || 0) + (data?.totalSectorOfficers || 0) + (data?.totalBoothCoordinators || 0)} Users
                </p>
                <div className="flex justify-between mt-4 text-purple-300/70 text-xs">
                  <span>Admins: {data?.totalPartyAdmins || 0}</span>
                  <span>Sectors: {data?.totalSectorOfficers || 0}</span>
                  <span>Coordinators: {data?.totalBoothCoordinators || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extra stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-xl">
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Total Elections</span>
              <span className="text-2xl font-bold text-slate-200 mt-1 block">{data?.totalElections || 0}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Total Booths</span>
              <span className="text-2xl font-bold text-slate-200 mt-1 block">{data?.totalBooths || 0}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Active Organizations</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">{data?.activeOrganizations || 0}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Trial Plans Running</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">{data?.trialOrganizations || 0}</span>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Recent Organizations</h2>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold">
                {data?.organizations?.length || 0} Total
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Contact / Phone</th>
                    <th className="py-4 px-6">Subscription Plan</th>
                    <th className="py-4 px-6">AI Tokens</th>
                    <th className="py-4 px-6">Party Admin</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {data?.organizations?.map((org) => (
                    <tr key={org._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{org.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{org.type.toLowerCase().replace(/_/g, " ")}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-200">{org.contactPerson}</div>
                        <div className="text-[10px] text-slate-500">{org.mobileNumber}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            org.subscriptionStatus === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : org.subscriptionStatus === "TRIAL"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {org.subscriptionStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-indigo-400">
                        {org.aiTokens?.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        {org.partyAdmin ? (
                          <div>
                            <div className="font-medium text-slate-200">{org.partyAdmin.name}</div>
                            <div className="text-[10px] text-slate-500">{org.partyAdmin.mobileNumber}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setIsAdminModalOpen(true);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold underline decoration-indigo-400/30 underline-offset-2"
                          >
                            + Create Admin
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex h-2.5 w-2.5 rounded-full ${
                            org.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" : "bg-slate-600"
                          }`}
                          title={org.isActive ? "Active" : "Inactive"}
                        />
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrg(org);
                            setPlanForm({
                              subscriptionStatus: org.subscriptionStatus,
                              aiTokens: org.aiTokens,
                            });
                            setIsPlanModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit Plan
                        </button>
                        <button
                          onClick={() => handleToggleStatus(org._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            org.isActive
                              ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {org.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.organizations || data?.organizations.length === 0) && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        No organizations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE ORGANIZATION MODAL */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-700">
            <div className="p-6 border-b border-slate-800 bg-indigo-600/10 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold text-indigo-400">Register New Organization</h3>
              <button onClick={() => setIsOrgModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateOrg} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BJP Maharashtra"
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Type</label>
                  <select
                    value={orgForm.type}
                    onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900"
                  >
                    <option value="POLITICAL_PARTY">Political Party</option>
                    <option value="CAMPAIGN_AGENCY">Campaign Agency</option>
                    <option value="INDEPENDENT_CANDIDATE">Independent Candidate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Subscription Status</label>
                  <select
                    value={orgForm.subscriptionStatus}
                    onChange={(e) => setOrgForm({ ...orgForm, subscriptionStatus: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900"
                  >
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Contact Person</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={orgForm.contactPerson}
                    onChange={(e) => setOrgForm({ ...orgForm, contactPerson: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit number"
                    value={orgForm.mobileNumber}
                    onChange={(e) => setOrgForm({ ...orgForm, mobileNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Allocated AI Tokens</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={orgForm.aiTokens}
                    onChange={(e) => setOrgForm({ ...orgForm, aiTokens: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOrgModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Create Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN / TOKENS EDIT MODAL */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-6 border-b border-slate-800 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Edit Organization Plan</h3>
                <p className="text-slate-400 text-xs mt-1">{selectedOrg?.name}</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Subscription Plan</label>
                <select
                  value={planForm.subscriptionStatus}
                  onChange={(e) => setPlanForm({ ...planForm, subscriptionStatus: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900"
                >
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">AI Tokens Balance</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={planForm.aiTokens}
                  onChange={(e) => setPlanForm({ ...planForm, aiTokens: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PARTY ADMIN MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700">
            <div className="p-6 border-b border-slate-800 bg-indigo-600/10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-indigo-400">Assign Party Admin</h3>
                <p className="text-slate-400 text-xs mt-1">For {selectedOrg?.name}</p>
              </div>
              <button onClick={() => setIsAdminModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold">
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Admin Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Patil"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mobile Number (Login ID)</label>
                <input
                  type="tel"
                  required
                  placeholder="10 digit phone number"
                  value={adminForm.mobileNumber}
                  onChange={(e) => setAdminForm({ ...adminForm, mobileNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Login Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Create & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default SuperAdminDashboard;
