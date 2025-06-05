const hre = require("hardhat");

async function main() {
  const InvestmentVault = await hre.ethers.getContractFactory("InvestmentVault");
  const vault = await InvestmentVault.deploy();

  await vault.waitForDeployment();
  console.log(`InvestmentVault deployed to: ${await vault.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
