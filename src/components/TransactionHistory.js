// src/components/TransactionHistory.js

import React from "react";

export default function TransactionHistory({ txHistory }) {
  if (!Array.isArray(txHistory) || txHistory.length === 0) {
    return (
      <div className="text-gray-400 text-center py-6">
        No transactions yet.
      </div>
    );
  }

  return (
    <table className="w-full table-auto text-left bg-slate-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-slate-700">
          <th className="px-4 py-2 text-gray-300">Block</th>
          <th className="px-4 py-2 text-gray-300">Type</th>
          <th className="px-4 py-2 text-gray-300">Amount (ETH)</th>
        </tr>
      </thead>
      <tbody>
        {txHistory.map((tx, idx) => (
          <tr
            key={idx}
            className={`${
              idx % 2 === 0 ? "bg-slate-800" : "bg-slate-700/90"
            } hover:bg-slate-700`}
          >
            <td className="px-4 py-2 text-gray-200">{tx.blockNumber}</td>
            <td className="px-4 py-2 text-gray-200">{tx.type}</td>
            <td className="px-4 py-2 text-gray-200">{tx.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
