const { expect } = require("chai");

describe("Tether Token contract", function () {
  let buidlerToken, owner, addr1, addr2

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TetherToken");

    buidlerToken = await Token.deploy(1000000, 'Tether USD', 'TUSD', 6);
    await buidlerToken.deployed();

  })


  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const ownerBalance = await buidlerToken.balanceOf(owner.getAddress());
    expect(await buidlerToken.totalSupply()).to.equal(ownerBalance);
  });
  it("Owner can transfer to addr1", async function () {
    await buidlerToken.transfer(addr1.getAddress(), 1000)
    const addr1Balance = await buidlerToken.balanceOf(addr1.getAddress());
    expect(await buidlerToken.balanceOf(addr1.getAddress())).to.equal(addr1Balance);
  });

  it("Addr1 can transfer to addr2", async function () {
    await buidlerToken.connect(addr1).transfer(addr2.getAddress(), 500)
    const addr1Balance = await buidlerToken.balanceOf(addr1.getAddress());
    expect(await buidlerToken.balanceOf(addr1.getAddress())).to.equal(addr1Balance);
    expect(await buidlerToken.balanceOf(addr2.getAddress())).to.equal(addr1Balance);
    console.info(`Addr2 now has: ${addr1Balance.toNumber()} TUSD`)
  });
});


