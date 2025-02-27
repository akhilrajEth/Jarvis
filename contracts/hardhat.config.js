require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    holesky: {
      url: process.env.RPC_ENDPOINT_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
