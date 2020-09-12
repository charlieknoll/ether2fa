const ethers = require("ethers")
const wallet2fa = require("../artifacts/Wallet2fa.json")

module.exports = async function generateWallet (coldStorageAddress, ticketCount) {

  //TODO pass in number of tickets and coldstorage as param
  //TODO move bulk functions to separate file, wrap in script and html page
  const authenticatorWallet = await ethers.Wallet.createRandom()

  //generat mneumonic for killphrase
  let killphrase = (await ethers.Wallet.createRandom()).mnemonic.phrase
  killphrase = killphrase + ' ' + (await ethers.Wallet.createRandom()).mnemonic.phrase
  const killphraseHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(killphrase))
  const walletComponents = { authenticator: await authenticatorWallet.getAddress(), killphrase, killphraseHash, authTickets: [] }

  for (let i = 0; i < ticketCount; i++) {
    const nonceHash = ethers.utils.keccak256(ethers.utils.hexZeroPad(i, 32))
    const sig = await authenticatorWallet.signMessage(ethers.utils.arrayify(nonceHash))
    walletComponents.authTickets.push({ nonce: i, sig })
  }


  //TODO write contract creation unsignedTx (without nonce, gasLimit, gasPrice; to, value, chainId should be null) for data param to use with MEW?
  //call create with authenticator,coldstorage,killphraseHash
  //const signer = new ethers.VoidSigner(coldStorageAddress)
  const factory = new ethers.ContractFactory(wallet2fa.abi, wallet2fa.bytecode)
  walletComponents.bytecode = wallet2fa.bytecode
  walletComponents.abi = wallet2fa.abi
  walletComponents.contractName = wallet2fa.contractName
  walletComponents.deployTx = factory.getDeployTransaction(await authenticatorWallet.getAddress(), coldStorageAddress, killphraseHash)
  return walletComponents
}

