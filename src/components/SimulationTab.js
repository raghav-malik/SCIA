import React from "react";
import { RefreshCw, CheckCircle, Wallet } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SimulationTab({
  simulationData,
  setSimulationData,
  runSimulation,
  handleDeposit,
  withdrawAmount,
  setWithdrawAmount,
  handleWithdraw,
  transactionStatus,
}) {
  // Mock historical performance data
  const simulationResults = [
    { date: "2023-01", value: 1000 },
    { date: "2023-02", value: 1150 },
    { date: "2023-03", value: 1080 },
    { date: "2023-04", value: 1320 },
    { date: "2023-05", value: 1280 },
    { date: "2023-06", value: 1450 },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Investment Simulation Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-purple-400" />
          Investment Simulation
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Investment Amount (USDT)</label>
            <input
              type="number"
              value={simulationData.amount}
              onChange={(e) =>
                setSimulationData({
                  ...simulationData,
                  amount: e.target.value,
                })
              }
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              placeholder="1000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                value={simulationData.startDate}
                onChange={(e) =>
                  setSimulationData({
                    ...simulationData,
                    startDate: e.target.value,
                  })
                }
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                value={simulationData.endDate}
                onChange={(e) =>
                  setSimulationData({
                    ...simulationData,
                    endDate: e.target.value,
                  })
                }
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
          </div>
          <button
            onClick={runSimulation}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            Run Simulation
          </button>
          {simulationData.results && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <h3 className="text-green-400 font-medium mb-2">
                Simulation Results
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Final Value:</span>
                  <span className="text-white font-bold">
                    ${simulationData.results.finalValue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Gain:</span>
                  <span className="text-green-400 font-bold">
                    +{simulationData.results.gain}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical Performance & Invest + Withdraw */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6">
          Historical Performance
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simulationResults}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Deposit (Invest) Section */}
        <div className="mt-8 p-4 bg-slate-700/50 rounded-lg">
          <h3 className="text-white font-medium mb-4">Investment Execution</h3>
          <div className="space-y-4">
            <button
              onClick={handleDeposit}
              disabled={transactionStatus === "pending"}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-2 rounded font-medium transition-colors flex items-center justify-center"
            >
              {transactionStatus === "pending" ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Invest
                </>
              )}
            </button>
            {transactionStatus === "success" && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Transaction successful!
              </div>
            )}
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
          <h3 className="text-white font-medium mb-4">Withdraw from Vault</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">
                Amount to Withdraw (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white"
                placeholder="0.5"
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={transactionStatus === "withdrawing"}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-2 rounded font-medium transition-colors flex items-center justify-center"
            >
              {transactionStatus === "withdrawing" ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Withdraw
                </>
              )}
            </button>
            {transactionStatus === "withdrawSuccess" && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Withdrawal successful!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
