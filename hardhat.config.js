require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
};
// require("@nomiclabs/hardhat-etherscan");
// require("dotenv").config();

// module.exports = {
//   solidity: "0.8.28",
//   networks: {
//     localhost: {
//       url: "http://127.0.0.1:8545",
//     },
//     goerli: {
//       url: `https://eth-goerli.alchemyapi.io/v2/${process.env.GOERLI_ALCHEMY_API_KEY}`,
//       accounts: [process.env.DEPLOYER_PRIVATE_KEY],
//     },
//   },
//   etherscan: {
//     apiKey: process.env.ETHERSCAN_API_KEY,
//   },
// };
