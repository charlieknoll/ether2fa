const { expect } = require("chai");

describe("2fa Wallet", function () {
  let buidler2faWallet, controller, authenticatorWallet, authenticator, coldStorage
  const killphrase = 'brain surround have swap horror body response double fire dumb bring hazard'
  //const killphraseHash = ethers.utils.id(killphrase)
  const killphraseHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(killphrase))
  async function sendEthToWallet () {
    let walletBalance = await ethers.provider.getBalance(buidler2faWallet.address)
    if (walletBalance.toString() == "0") {
      tx = {
        to: buidler2faWallet.address,
        value: ethers.utils.parseEther("1.0")
      }

      //await controller.signTransaction(tx)
      const sentTx = await controller.sendTransaction(tx)
      walletBalance = await ethers.provider.getBalance(buidler2faWallet.address)
    }
    return walletBalance
  }
  async function logController () {
    console.log('balance: ' + ethers.utils.formatEther(await ethers.provider.getBalance(controller.getAddress())))
  }
  async function getCurrentNonceHashSig () {
    //get contract nonce
    const nonce = await buidler2faWallet.nonce()
    const nonceHash = ethers.utils.keccak256(ethers.utils.hexZeroPad(nonce, 32))

    //sign nonce
    return { nonce, sig: await authenticatorWallet.signMessage(ethers.utils.arrayify(nonceHash)) }

  }

  before(async function () {
    [controller, coldStorage] = await ethers.getSigners();
    //TODO generate authenticator address
    authenticatorWallet = await ethers.Wallet.createRandom()
    authenticator = authenticatorWallet.address

    const Wallet2fa = await ethers.getContractFactory("Wallet2fa");

    buidler2faWallet = await Wallet2fa.deploy(authenticator, coldStorage.getAddress(), killphraseHash);
    await buidler2faWallet.deployed();

  })


  it("should accept ether", async function () {
    const walletBalance = await sendEthToWallet()
    expect(walletBalance).to.equal(ethers.utils.parseEther("1.0"));
  });


  it("can send funds", async function () {
    const walletBalance = await sendEthToWallet()
    const metaTx = [await coldStorage.getAddress(), ethers.utils.parseEther("0.5"), '0x']


    const { nonce, sig } = await getCurrentNonceHashSig()
    console.log('sig: ' + sig)

    const coldStorageInitBalance = await ethers.provider.getBalance(coldStorage.getAddress())

    const result = await buidler2faWallet.execute(metaTx, sig)

    const coldStorageEndBalance = await ethers.provider.getBalance(coldStorage.getAddress())
    expect(coldStorageInitBalance).to.equal(coldStorageEndBalance.sub(ethers.utils.parseEther("0.5")));
    const newNonce = await buidler2faWallet.nonce()
    console.log("nonce:" + newNonce.toString())
    expect(nonce).to.equal(newNonce.add(- 1));
  });
  it("can't send funds if insufficient", async function () {
    const walletBalance = await sendEthToWallet()

    const metaTx = [await coldStorage.getAddress(), ethers.utils.parseEther("1.5"), '0x']

    const { nonce, sig } = await getCurrentNonceHashSig()
    const coldStorageInitBalance = await ethers.provider.getBalance(coldStorage.getAddress())

    const result = await buidler2faWallet.execute(metaTx, sig)
    //TODO look for revert event
    const events = buidler2faWallet.filters.Revert()

    const coldStorageEndBalance = await ethers.provider.getBalance(coldStorage.getAddress())
    expect(coldStorageInitBalance).to.equal(coldStorageEndBalance);
    const newNonce = await buidler2faWallet.nonce()
    console.log("nonce:" + newNonce.toString())
    expect(nonce).to.equal(newNonce.add(- 1));
  });

  it("can call contract", async function () {
    const Token = await ethers.getContractFactory("TetherToken");

    buidlerToken = await Token.deploy(1000000, 'Tether USD', 'TUSD', 6);
    await buidlerToken.deployed();
    //Send TetherToken to 2faWallet
    await buidlerToken.transfer(buidler2faWallet.address, 1000)

    const walletBalance = await buidlerToken.balanceOf(buidler2faWallet.address)

    //get raw tx, which requests transfer to coldstorage account
    const tx = await buidlerToken.populateTransaction.transfer(coldStorage.getAddress(), 1000)

    const metaTx = [await buidlerToken.address, ethers.utils.parseEther("0.0"), tx.data]

    const { nonce, sig } = await getCurrentNonceHashSig()

    await logController()
    const result = await buidler2faWallet.execute(metaTx, sig)
    const events = buidler2faWallet.filters.Revert()
    console.log(events)

    await logController()

    const newBalance = await buidlerToken.balanceOf(coldStorage.getAddress())

    expect(newBalance).to.equal(1000);
    const newNonce = await buidler2faWallet.nonce()
    console.log("nonce:" + newNonce.toString())
    expect(nonce).to.equal(newNonce.add(- 1));

  })

  it("can call contract that reverts", async function () {
    const Token = await ethers.getContractFactory("TetherToken");

    buidlerToken = await Token.deploy(1000000, 'Tether USD', 'TUSD', 6);
    await buidlerToken.deployed();
    //Send TetherToken to 2faWallet
    await buidlerToken.transfer(buidler2faWallet.address, 1000)

    const walletBalance = await buidlerToken.balanceOf(buidler2faWallet.address)

    //get raw tx, which requests transfer to coldstorage account, send too many tokens and check for revert
    const tx = await buidlerToken.populateTransaction.transfer(coldStorage.getAddress(), 1500)

    const metaTx = [await buidlerToken.address, ethers.utils.parseEther("0.0"), tx.data]

    const { nonce, sig } = await getCurrentNonceHashSig()

    let events = await buidler2faWallet.queryFilter(buidler2faWallet.filters.Revert())
    const result = await buidler2faWallet.execute(metaTx, sig)

    let updatedEvents = await buidler2faWallet.queryFilter(buidler2faWallet.filters.Revert())
    expect(events.length).to.equal(updatedEvents.length - 1)


    //await logController()

    const newBalance = await buidlerToken.balanceOf(coldStorage.getAddress())

    expect(newBalance).to.equal(0);
    const newNonce = await buidler2faWallet.nonce()
    console.log("nonce:" + newNonce.toString())
    expect(nonce).to.equal(newNonce.add(- 1));

  })


  it("can be killed", async function () {

    await sendEthToWallet()

    const coldStorageBalance = await ethers.provider.getBalance(coldStorage.getAddress())
    let code = await ethers.provider.getCode(buidler2faWallet.address)

    let result = await buidler2faWallet.kill(killphrase)

    const newColdStorageBalance = await ethers.provider.getBalance(coldStorage.getAddress())
    expect(coldStorageBalance).to.below(newColdStorageBalance);

    code = await ethers.provider.getCode(buidler2faWallet.address)
    expect(code).to.equal('0x')

  });

  //TODO test 1000's of nonce's
});


