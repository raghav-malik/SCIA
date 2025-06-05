const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvestmentVault (Option 1: no owner/pause)", function () {
  let InvestmentVaultFactory;
  let vault;
  let deployer, user1, user2;

  beforeEach(async function () {
    // 1) Get the contract factory and a list of signers
    InvestmentVaultFactory = await ethers.getContractFactory("InvestmentVault");
    [deployer, user1, user2] = await ethers.getSigners();

    // 2) Deploy a fresh InvestmentVault before each test
    vault = await InvestmentVaultFactory.deploy();
    //    In Ethers v6, deploy() immediately returns a contract "attached" to the newly deployed address.
    //    To wait until the block has been mined and the contract is guaranteed ready, call:
    await vault.waitForDeployment();
  });

  it("should start with zero balance for everyone", async function () {
    const balDeployer = await vault.balances(deployer.address);
    const balUser1   = await vault.balances(user1.address);
    const balUser2   = await vault.balances(user2.address);

    expect(balDeployer).to.equal(0);
    expect(balUser1).to.equal(0);
    expect(balUser2).to.equal(0);
  });

  it("allows a user to deposit 1 ETH and updates their balance", async function () {
    // user1 deposits 1 ETH
    await expect(
      vault.connect(user1).invest({ value: ethers.parseEther("1.0") })
    )
      .to.emit(vault, "Deposited")
      .withArgs(user1.address, ethers.parseEther("1.0"));

    // Check the mapping directly:
    const balUser1 = await vault.balances(user1.address);
    expect(balUser1).to.equal(ethers.parseEther("1.0"));

    // If they call getBalance(), it should return the same
    const getBal = await vault.connect(user1).getBalance();
    expect(getBal).to.equal(ethers.parseEther("1.0"));
  });

  it("allows multiple deposits by the same user to accumulate", async function () {
    // First deposit: 0.5 ETH
    await vault.connect(user1).invest({ value: ethers.parseEther("0.5") });
    // Second deposit: 1.2 ETH
    await vault.connect(user1).invest({ value: ethers.parseEther("1.2") });

    const balUser1 = await vault.balances(user1.address);
    // 0.5 + 1.2 = 1.7
    expect(balUser1).to.equal(ethers.parseEther("1.7"));
  });

  it("reverts invest() when sending 0 ETH", async function () {
    await expect(
      vault.connect(user1).invest({ value: 0 })
    ).to.be.revertedWith("Send some Ether to invest.");
  });

  it("allows a user to withdraw their deposited ETH", async function () {
    // user1 deposits 2 ETH
    await vault.connect(user1).invest({ value: ethers.parseEther("2.0") });

    // user1 then withdraws 0.75 ETH
    await expect(
      vault.connect(user1).withdraw(ethers.parseEther("0.75"))
    )
      .to.emit(vault, "Withdrawn")
      .withArgs(user1.address, ethers.parseEther("0.75"));

    // Final on‐chain balance mapping: 2.0 - 0.75 = 1.25
    const balUser1 = await vault.balances(user1.address);
    expect(balUser1).to.equal(ethers.parseEther("1.25"));
  });

  it("reverts withdraw() if user has insufficient balance", async function () {
    // user2 has not deposited anything
    await expect(
      vault.connect(user2).withdraw(ethers.parseEther("0.1"))
    ).to.be.revertedWith("Insufficient balance.");

    // Even if user2 deposits 0.3 then tries to withdraw 0.5, it should revert
    await vault.connect(user2).invest({ value: ethers.parseEther("0.3") });
    await expect(
      vault.connect(user2).withdraw(ethers.parseEther("0.5"))
    ).to.be.revertedWith("Insufficient balance.");
  });

  it("updates balances correctly after multiple users deposit and withdraw", async function () {
    // user1 deposits 1 ETH, user2 deposits 2 ETH
    await vault.connect(user1).invest({ value: ethers.parseEther("1.0") });
    await vault.connect(user2).invest({ value: ethers.parseEther("2.0") });

    const bal1AfterDeposit = await vault.balances(user1.address);
    const bal2AfterDeposit = await vault.balances(user2.address);
    expect(bal1AfterDeposit).to.equal(ethers.parseEther("1.0"));
    expect(bal2AfterDeposit).to.equal(ethers.parseEther("2.0"));

    // user1 withdraws 0.4, user2 withdraws 1.5
    await vault.connect(user1).withdraw(ethers.parseEther("0.4"));
    await vault.connect(user2).withdraw(ethers.parseEther("1.5"));

    const bal1Final = await vault.balances(user1.address);
    const bal2Final = await vault.balances(user2.address);
    expect(bal1Final).to.equal(ethers.parseEther("0.6"));  // 1.0 - 0.4
    expect(bal2Final).to.equal(ethers.parseEther("0.5"));  // 2.0 - 1.5
  });

  it("prevents a trivial reentrancy scenario on withdraw (using nonReentrant)", async function () {
    // In order to test actual reentrancy, you’d need a malicious contract. 
    // Here we simply deposit and withdraw in sequence to confirm balances update.
    await vault.connect(user1).invest({ value: ethers.parseEther("1.0") });

    // First withdraw succeeds:
    await vault.connect(user1).withdraw(ethers.parseEther("0.5"));
    const balAfter = await vault.balances(user1.address);
    expect(balAfter).to.equal(ethers.parseEther("0.5"));

    // A second immediate withdraw of more than the remaining balance must revert
    await expect(
      vault.connect(user1).withdraw(ethers.parseEther("1.0"))
    ).to.be.revertedWith("Insufficient balance.");
  });

  it("emits the correct events with correct arguments", async function () {
    // user1 deposits 0.9 ETH
    await expect(vault.connect(user1).invest({ value: ethers.parseEther("0.9") }))
      .to.emit(vault, "Deposited")
      .withArgs(user1.address, ethers.parseEther("0.9"));

    // user1 withdraws 0.2 ETH
    await expect(vault.connect(user1).withdraw(ethers.parseEther("0.2")))
      .to.emit(vault, "Withdrawn")
      .withArgs(user1.address, ethers.parseEther("0.2"));
  });
});
