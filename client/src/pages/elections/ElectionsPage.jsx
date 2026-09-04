import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  getElections,
  createElection,
  updateElection,
} from "../../services/election.service";

const defaultForm = {
  name: "",
  type: "LOK_SABHA",
  startDate: "",
  endDate: "",
};

function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [editingElection, setEditingElection] = useState(null);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const data = await getElections();
      setElections(data.elections);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingElection(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return alert("Election name is required.");
    }
    if (!formData.startDate || !formData.endDate) {
      return alert("Start date and end date are required.");
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return alert("End date must be after start date.");
    }

    try {
      if (editingElection) {
        await updateElection(editingElection._id, formData);
        alert("Election updated successfully.");
      } else {
        await createElection(formData);
        alert("Election created successfully.");
      }

      fetchElections();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save election");
    }
  };

  const handleEdit = (election) => {
    setEditingElection(election);
    setFormData({
      name: election.name || "",
      type: election.type || "LOK_SABHA",
      startDate: new Date(election.startDate).toISOString().slice(0, 10),
      endDate: new Date(election.endDate).toISOString().slice(0, 10),
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Elections</h1>
              <p className="text-slate-400 mt-2">
                Manage election cycles and keep campaign planning aligned.
              </p>
            </div>
            {editingElection && (
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
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Election Name
                </label>
                <input
                  type="text"
                  placeholder="Election Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Election Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="LOK_SABHA">Lok Sabha</option>
                  <option value="ASSEMBLY">Assembly</option>
                  <option value="LOCAL_BODY">Local Body</option>
                  <option value="PANCHAYAT">Panchayat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              {editingElection ? "Update Election" : "Create Election"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Start Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">End Date</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {elections.map((election) => (
                    <tr key={election._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">{election.name}</td>
                      <td className="px-6 py-4 text-slate-300">{new Date(election.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-300">{new Date(election.endDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          election.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : election.status === "UPCOMING"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-slate-850 text-slate-400 border border-slate-700"
                        }`}>
                          {election.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(election)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
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

export default ElectionsPage;
