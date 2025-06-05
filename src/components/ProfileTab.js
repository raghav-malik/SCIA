import React from "react";
import { Shield, CheckCircle } from "lucide-react";

export default function ProfileTab({
  userProfile,
  setUserProfile,
  walletConnected,
  walletAddress,
  vaultBalance,
  viewingVault,
  fetchVaultBalance,
}) {
  const handleRiskAssessment = (level) => {
    setUserProfile({
      ...userProfile,
      riskLevel: level,
      isProfileComplete: true,
    });
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case "Conservative":
        return "bg-green-100 text-green-800";
      case "Balanced":
        return "bg-yellow-100 text-yellow-800";
      case "Aggressive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Risk Assessment */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-purple-400" />
          Risk Assessment
        </h2>
        <div className="space-y-4">
          <p className="text-gray-300 mb-4">
            Select your investment risk tolerance:
          </p>
          {["Conservative", "Balanced", "Aggressive"].map((level) => (
            <button
              key={level}
              onClick={() => handleRiskAssessment(level)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                userProfile.riskLevel === level
                  ? "border-purple-400 bg-purple-500/20"
                  : "border-slate-600 hover:border-slate-500"
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-white">{level}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {level === "Conservative" && "Low risk, steady returns"}
                  {level === "Balanced" && "Moderate risk, balanced growth"}
                  {level === "Aggressive" && "High risk, maximum potential"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6">
          Profile Summary
        </h2>
        <div className="space-y-4">
          {userProfile.riskLevel && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Risk Level:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeColor(
                  userProfile.riskLevel
                )}`}
              >
                {userProfile.riskLevel}
              </span>
            </div>
          )}
          {walletConnected && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Wallet:</span>
                <span className="text-white font-mono">{walletAddress}</span>
              </div>

              {/* View Vault Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    fetchVaultBalance(walletAddress);
                  }}
                  disabled={viewingVault}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewingVault
                      ? "bg-gray-600 text-white cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {viewingVault ? "Fetching Vault…" : "View Vault"}
                </button>
                {vaultBalance !== null && (
                  <span className="text-indigo-300">
                    Balance:{" "}
                    <span className="font-mono">{vaultBalance} ETH</span>
                  </span>
                )}
              </div>
            </>
          )}
          {userProfile.isProfileComplete && (
            <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5 mr-2" />
                Profile Complete
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
