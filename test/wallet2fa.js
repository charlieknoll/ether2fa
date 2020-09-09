const { expect } = require("chai");


describe("2fa Wallet", function () {
  let buidler2faWallet, controller, authenticator, coldStorage
  const killphrase = 'brain surround have swap horror body response double fire dumb bring hazard'
  const killphraseHash = ethers.utils.id(killphrase)

  before(async function () {
    [controller, coldStorage] = await ethers.getSigners();

    //TODO generate authenticator address
    const authenticatorWallet = await ethers.Wallet.createRandom()
    authenticator = authenticatorWallet.address

    const Wallet2fa = await ethers.getContractFactory("Wallet2fa");

    buidler2faWallet = await Wallet2fa.deploy(authenticator, coldStorage.getAddress(), killphraseHash);
    await buidler2faWallet.deployed();

  })


  it("Wallet should accept ether", async function () {

    tx = {
      to: buidler2faWallet.address,
      value: ethers.utils.parseEther("1.0")
    }

    //await controller.signTransaction(tx)
    const sentTx = await controller.sendTransaction(tx)

    const walletBalance = await ethers.provider.getBalance(buidler2faWallet.address)
    expect(walletBalance).to.equal(ethers.utils.parseEther("1.0"));
  });
  // it("Owner can transfer to addr1", async function () {
  //   await buidlerToken.transfer(addr1.getAddress(), 1000)
  //   const addr1Balance = await buidlerToken.balanceOf(addr1.getAddress());
  //   expect(await buidlerToken.balanceOf(addr1.getAddress())).to.equal(addr1Balance);
  // });

  // it("Addr1 can transfer to addr2", async function () {
  //   await buidlerToken.connect(addr1).transfer(addr2.getAddress(), 500)
  //   const addr1Balance = await buidlerToken.balanceOf(addr1.getAddress());
  //   expect(await buidlerToken.balanceOf(addr1.getAddress())).to.equal(addr1Balance);
  //   expect(await buidlerToken.balanceOf(addr2.getAddress())).to.equal(addr1Balance);
  //   console.info(`Addr2 now has: ${addr1Balance.toNumber()} TUSD`)
  // });
});


