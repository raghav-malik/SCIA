import React from "react";
import { RefreshCw, DollarSign, TrendingUp, Percent, AlertCircle } from "lucide-react";

export default function DashboardTab({ txHistory }) {
  // Mock holdings (you can replace with on‐chain data later)
  const currentHoldings = [
    { token: "BTC", amount: "0.025", value: "$1,250", percentage: "50%" },
    { token: "ETH", amount: "2.5", value: "$750", percentage: "30%" },
    { token: "LINK", amount: "45", value: "$500", percentage: "20%" },
  ];

  return (
    <div className="space-y-8">
      {/* Top‐Level Metrics */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-white">$2,500</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">24h Change</p>
              <p className="text-2xl font-bold text-green-400">+5.2%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">ROI</p>
              <p className="text-2xl font-bold text-purple-400">+25%</p>
            </div>
            <Percent className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Holdings & Performance */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Holdings */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Current Holdings</h2>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Rebalance
            </button>
          </div>
          <div className="space-y-4">
            {currentHoldings.map((holding) => (
              <div
                key={holding.token}
                className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-white">{holding.token}</div>
                  <div className="text-sm text-gray-400">{holding.amount} tokens</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">{holding.value}</div>
                  <div className="text-sm text-gray-400">{holding.percentage}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-6">Performance Metrics</h2>
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Sharpe Ratio</span>
              <span className="text-white font-medium">1.42</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Volatility</span>
              <span className="text-yellow-400 font-medium">15.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Max Drawdown</span>
              <span className="text-red-400 font-medium">-8.2%</span>
            </div>
            <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center text-blue-400 mb-2">
                <AlertCircle className="w-4 h-4 mr-2" />
                Rebalancing Suggestion
              </div>
              <p className="text-blue-200 text-sm">
                Consider rebalancing your portfolio. BTC allocation has grown to 55%,
                exceeding your target of 50%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4">
          Vault Transaction History
        </h2>

        {txHistory.length === 0 ? (
          <p className="text-gray-400">No deposits or withdrawals found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto border-collapse">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-2 text-gray-300">Type</th>
                  <th className="px-4 py-2 text-gray-300">Amount (ETH)</th>
                  <th className="px-4 py-2 text-gray-300">Block #</th>
                  <th className="px-4 py-2 text-gray-300">Txn Hash</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.map((tx, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-slate-700/50" : "bg-slate-800/50"
                    }`}
                  >
                    <td className="px-4 py-2 text-white">{tx.type}</td>
                    <td className="px-4 py-2 text-white">{tx.amount}</td>
                    <td className="px-4 py-2 text-gray-300">{tx.blockNumber}</td>
                    <td className="px-4 py-2 text-blue-400 underline">
                      <a
                        href={`https://etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate block max-w-xs"
                      >
                        {tx.txHash}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
