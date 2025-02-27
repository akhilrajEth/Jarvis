const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ETHCollectorModule", (m) => {
  const ethCollector = m.contract("ETHCollector");

  return { ethCollector };
});
