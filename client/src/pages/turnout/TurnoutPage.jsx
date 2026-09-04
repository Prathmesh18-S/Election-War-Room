import { useEffect, useState } from "react";

import MainLayout from "../../components/layout/MainLayout";

import {
  getTurnoutRecords,
  submitTurnout,
} from "../../services/turnout.service";

import {
  getElections,
} from "../../services/election.service";

import {
  getBooths,
} from "../../services/booth.service";

function TurnoutPage() {
  const [records, setRecords] =
    useState([]);

  const [elections, setElections] =
    useState([]);

  const [booths, setBooths] =
    useState([]);

  const [formData, setFormData] =
    useState({
      electionId: "",
      boothId: "",
      reportHour: "",
      totalVotesCast: "",
    });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const turnoutData =
      await getTurnoutRecords();

    const electionData =
      await getElections();

    const boothData =
      await getBooths();

    setRecords(
      turnoutData.turnoutRecords
    );

    setElections(
      electionData.elections
    );

    setBooths(
      boothData.booths
    );
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        await submitTurnout(
          formData
        );

        fetchData();

        setFormData({
          electionId: "",
          boothId: "",
          reportHour: "",
          totalVotesCast: "",
        });
      } catch (error) {
        alert(
          error.response?.data
            ?.message
        );
      }
    };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-950 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Turnout</h1>
              <p className="text-slate-400 mt-2">
                Monitor and record voter turnout statistics.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Election
                </label>
                <select
                  value={formData.electionId}
                  onChange={(e) => setFormData({ ...formData, electionId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="">Select Election</option>
                  {elections.map((el) => (
                    <option key={el._id} value={el._id}>
                      {el.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Booth
                </label>
                <select
                  value={formData.boothId}
                  onChange={(e) => setFormData({ ...formData, boothId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="">Select Booth</option>
                  {booths.map((b) => (
                    <option key={b._id} value={b._id}>
                      Booth #{b.boothNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Report Hour (e.g. 09:00)
                </label>
                <input
                  type="text"
                  placeholder="HH:00"
                  value={formData.reportHour}
                  onChange={(e) => setFormData({ ...formData, reportHour: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Total Votes Cast
                </label>
                <input
                  type="number"
                  placeholder="Total Votes"
                  value={formData.totalVotesCast}
                  onChange={(e) => setFormData({ ...formData, totalVotesCast: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
              >
                Submit Turnout
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-800/50 text-slate-400 uppercase text-xs font-semibold tracking-wide">
                  <tr>
                    <th className="px-6 py-4">Booth</th>
                    <th className="px-6 py-4">Hour</th>
                    <th className="px-6 py-4 text-right">Votes</th>
                    <th className="px-6 py-4 text-right">Turnout %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {records.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        Booth #{record.boothId?.boothNumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {record.reportHour}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium text-right">
                        {record.totalVotesCast}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {record.turnoutPercentage ? `${record.turnoutPercentage}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        No turnout records found.
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

export default TurnoutPage;