const ethers = require("ethers")
const fs = require('fs');
const fsPromises = fs.promises;

async function main () {

  //TODO pass in number of tickets and coldstorage as param
  //TODO move bulk functions to separate file, wrap in script and html page
  const authenticatorWallet = await ethers.Wallet.createRandom()

  //generat mneumonic for killphrase
  let killphrase = (await ethers.Wallet.createRandom()).mnemonic.phrase
  killphrase = killphrase + ' ' + (await ethers.Wallet.createRandom()).mnemonic.phrase
  const killphraseHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(killphrase))
  const auth2fa = { killphrase, authTickets: [] }

  for (let i = 0; i < 1000; i++) {
    const nonceHash = ethers.utils.keccak256(ethers.utils.hexZeroPad(i, 32))
    const sig = await authenticatorWallet.signMessage(ethers.utils.arrayify(nonceHash))
    auth2fa.authTickets.push({ nonce: i, sig })
  }


  //TODO write contract creation bytecode for data param to use with MEW?

  console.log("Killphrase: " + auth2fa.killphrase)
  console.log("Killpharse Hash: " + killphraseHash)
  try {
    await fsPromises.writeFile("wallet2fa-" + killphraseHash + ".json", JSON.stringify(auth2fa), 'utf8')
    console.log("2FA Wallet  file has been saved.");
  } catch (err) {
    console.log("An error occured while writing the 2FA Wallet file.");
    return console.log(err);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
