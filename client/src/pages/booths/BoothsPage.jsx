import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  getBooths,
  createBooth,
  updateBooth,
  assignCoordinator,
  assignSectorOfficer,
} from "../../services/booth.service";

import {
  getElections,
} from "../../services/election.service";

import {
  getUsers,
} from "../../services/user.service";

const defaultForm = {
  boothNumber: "",
  electionId: "",
  state: "",
  district: "",
  constituency: "",
  pollingStationName: "",
  totalRegisteredVoters: "",
};

function BoothsPage() {
  const [booths, setBooths] = useState([]);
  const [elections, setElections] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [sectorOfficers, setSectorOfficers] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState({});
  const [selectedSectorOfficer, setSelectedSectorOfficer] = useState({});
  const [formData, setFormData] = useState(defaultForm);
  const [editingBooth, setEditingBooth] = useState(null);

  useEffect(() => {
    fetchBooths();
    fetchElections();
    fetchCoordinatorsAndSectors();
  }, []);

  const fetchBooths = async () => {
    const data = await getBooths();
    setBooths(data.booths);
  };

  const fetchElections = async () => {
    const data = await getElections();
    setElections(data.elections);
  };

  const fetchCoordinatorsAndSectors = async () => {
    try {
      const data = await getUsers();
      const boothCoordinators = data.users.filter(
        (user) => user.role === "BOOTH_COORDINATOR"
      );
      const sectorList = data.users.filter(
        (user) => user.role === "SECTOR_OFFICER"
      );
      setCoordinators(boothCoordinators);
      setSectorOfficers(sectorList);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingBooth(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.boothNumber.trim()) {
      return alert("Booth number is required.");
    }
    if (!formData.electionId) {
      return alert("Election selection is required.");
    }
    if (!formData.state.trim() || !formData.district.trim() || !formData.constituency.trim()) {
      return alert("State, district and constituency are required.");
    }
    if (!formData.pollingStationName.trim()) {
      return alert("Polling station name is required.");
    }
    if (formData.totalRegisteredVoters === "" || Number(formData.totalRegisteredVoters) < 0) {
      return alert("Registered voters must be a valid number.");
    }

    try {
      if (editingBooth) {
        await updateBooth(editingBooth._id, {
          ...formData,
          totalRegisteredVoters: Number(formData.totalRegisteredVoters),
        });
        alert("Booth updated successfully.");
      } else {
        await createBooth({
          ...formData,
          totalRegisteredVoters: Number(formData.totalRegisteredVoters),
        });
        alert("Booth created successfully.");
      }

      fetchBooths();
      resetForm();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to save booth"
      );
    }
  };

  const handleEdit = (booth) => {
    setEditingBooth(booth);
    setFormData({
      boothNumber: booth.boothNumber || "",
      electionId: booth.electionId?._id || "",
      state: booth.state || "",
      district: booth.district || "",
      constituency: booth.constituency || "",
      pollingStationName: booth.pollingStationName || "",
      totalRegisteredVoters: booth.totalRegisteredVoters?.toString() || "",
    });
  };

  const handleAssignCoordinator = async (boothId) => {
    try {
      const coordinatorId = selectedCoordinator[boothId];
      if (!coordinatorId) {
        return alert("Select coordinator");
      }
      await assignCoordinator(boothId, coordinatorId);
      alert("Coordinator assigned successfully");
      fetchBooths();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to assign coordinator"
      );
    }
  };

  const handleAssignSectorOfficer = async (boothId) => {
    try {
      const sectorOfficerId = selectedSectorOfficer[boothId];
      if (!sectorOfficerId) {
        return alert("Select Sector Officer");
      }
      await assignSectorOfficer(boothId, sectorOfficerId);
      alert("Sector Officer assigned successfully");
      fetchBooths();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to assign Sector Officer"
      );
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Booths</h1>
              <p className="text-slate-400 mt-2">
                Create and manage polling booths, assignments, and status.
              </p>
            </div>
            {editingBooth && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 font-semibold transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Booth Number
                </label>
                <input
                  placeholder="Booth Number"
                  value={formData.boothNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      boothNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Election
                </label>
                <select
                  value={formData.electionId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      electionId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="">Select Election</option>
                  {elections.map((election) => (
                    <option key={election._id} value={election._id}>
                      {election.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  State
                </label>
                <input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  District
                </label>
                <input
                  placeholder="District"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      district: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Constituency
                </label>
                <input
                  placeholder="Constituency"
                  value={formData.constituency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      constituency: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Polling Station
                </label>
                <input
                  placeholder="Polling Station"
                  value={formData.pollingStationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pollingStationName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Registered Voters
                </label>
                <input
                  type="number"
                  placeholder="Registered Voters"
                  value={formData.totalRegisteredVoters}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalRegisteredVoters: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
              >
                {editingBooth ? "Update Booth" : "Create Booth"}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold tracking-wide">
                  <tr>
                    <th className="px-6 py-4">Booth</th>
                    <th className="px-6 py-4">Election</th>
                    <th className="px-6 py-4">Coordinator</th>
                    <th className="px-6 py-4">Sector Officer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {booths.map((booth) => (
                    <tr key={booth._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {booth.boothNumber}
                        <div className="text-xs text-slate-500 mt-1">{booth.pollingStationName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{booth.electionId?.name}</td>
                      <td className="px-6 py-4 font-medium text-slate-400">{booth.assignedCoordinator?.name || "Not Assigned"}</td>
                      <td className="px-6 py-4 font-medium text-slate-400">{booth.assignedSectorOfficer?.name || "Not Assigned"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${booth.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20"}`}>
                          {booth.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          onClick={() => handleEdit(booth)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 border border-slate-700 rounded-full px-4 py-2 hover:bg-slate-800 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
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

export default BoothsPage;