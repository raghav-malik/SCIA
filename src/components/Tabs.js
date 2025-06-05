import React from "react";
import { Shield, Target, Activity, BarChart3, DollarSign } from "lucide-react";

export default function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "profile", label: "Profile", icon: Shield },
    { id: "portfolio", label: "Portfolio", icon: Target },
    { id: "simulation", label: "Simulation", icon: Activity },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "risk", label: "Risk", icon: DollarSign }, // Risk/Profile AI tab
  ];

  return (
    <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg mb-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
            activeTab === tab.id
              ? "bg-purple-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-slate-700"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
