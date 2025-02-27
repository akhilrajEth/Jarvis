const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ETHCollector", function () {
  async function deployETHCollectorFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const ETHCollector = await ethers.getContractFactory("ETHCollector");
    const ethCollector = await ETHCollector.deploy();
    return { ethCollector, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right WITHDRAWAL_ADDRESS", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      expect(await ethCollector.WITHDRAWAL_ADDRESS()).to.equal("0x728d820C813e7cD9652C99355160480f9282A5Ab");
    });

    it("Should set the right TARGET_BALANCE", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      expect(await ethCollector.TARGET_BALANCE()).to.equal(ethers.parseEther("32"));
    });

    it("Should initialize with zero totalDeposits", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      expect(await ethCollector.totalDeposits()).to.equal(0);
    });

    it("Should initialize as not paused", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      expect(await ethCollector.isPaused()).to.be.false;
    });
  });

  describe("Deposits", function () {
    it("Should accept deposits and update balances", async function () {
      const { ethCollector, owner } = await loadFixture(deployETHCollectorFixture);
      const depositAmount = ethers.parseEther("1");
      await ethCollector.deposit({ value: depositAmount });
      expect(await ethCollector.deposits(owner.address)).to.equal(depositAmount);
      expect(await ethCollector.totalDeposits()).to.equal(depositAmount);
    });

    it("Should pause and transfer funds when TARGET_BALANCE is reached", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      const targetBalance = await ethCollector.TARGET_BALANCE();
      await ethCollector.deposit({ value: targetBalance });
      expect(await ethCollector.isPaused()).to.be.true;
      expect(await ethers.provider.getBalance(ethCollector.target)).to.equal(0);
    });

    it("Should revert deposits when paused", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      const targetBalance = await ethCollector.TARGET_BALANCE();
      await ethCollector.deposit({ value: targetBalance });
      await expect(ethCollector.deposit({ value: 1 })).to.be.revertedWith("Contract is paused");
    });
  });

  describe("Withdrawals", function () {
    it("Should allow withdrawal of deposited funds", async function () {
      const { ethCollector, owner } = await loadFixture(deployETHCollectorFixture);
      const depositAmount = ethers.parseEther("1");
      await ethCollector.deposit({ value: depositAmount });
      await expect(ethCollector.withdraw()).to.changeEtherBalances(
        [owner, ethCollector],
        [depositAmount, -depositAmount]
      );
    });

    it("Should update balances after withdrawal", async function () {
      const { ethCollector, owner } = await loadFixture(deployETHCollectorFixture);
      const depositAmount = ethers.parseEther("1");
      await ethCollector.deposit({ value: depositAmount });
      await ethCollector.withdraw();
      expect(await ethCollector.deposits(owner.address)).to.equal(0);
      expect(await ethCollector.totalDeposits()).to.equal(0);
    });

    it("Should revert withdrawal when no funds", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      await expect(ethCollector.withdraw()).to.be.revertedWith("No funds to withdraw");
    });

    it("Should revert withdrawal when paused", async function () {
      const { ethCollector } = await loadFixture(deployETHCollectorFixture);
      const targetBalance = await ethCollector.TARGET_BALANCE();
      await ethCollector.deposit({ value: targetBalance });
      await expect(ethCollector.withdraw()).to.be.revertedWith("Contract is paused");
    });
  });

  describe("getBalance", function () {
    it("Should return correct balance for an address", async function () {
      const { ethCollector, owner } = await loadFixture(deployETHCollectorFixture);
      const depositAmount = ethers.parseEther("1");
      await ethCollector.deposit({ value: depositAmount });
      expect(await ethCollector.getBalance()).to.equal(depositAmount);
    });
  });
});
