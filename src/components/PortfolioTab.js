import React from "react";
import { Target } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function PortfolioTab({ userProfile }) {
  // Mock data (you can replace with real AI output later)
  const portfolioData = [
    { name: "BTC", value: 50, color: "#f7931a" },
    { name: "ETH", value: 30, color: "#627eea" },
    { name: "LINK", value: 20, color: "#2a5ada" },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-400" />
          Recommended Portfolio
        </h2>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {portfolioData.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center"
            >
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-white">{item.name}</span>
              </div>
              <span className="text-gray-300">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6">AI Commentary</h2>
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
          <p className="text-purple-200 italic">
            "We recommend this allocation based on your{" "}
            {userProfile.riskLevel.toLowerCase()} risk profile. This portfolio
            balances growth potential with risk management, focusing on
            established cryptocurrencies with strong fundamentals."
          </p>
        </div>
      </div>
    </div>
  );
}
