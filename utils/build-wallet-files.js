const fs = require('fs');
const fsPromises = fs.promises;
const factory2fa = require('../lib/factory2fa')

async function main () {
  const coldStorageAddr = "0xC96983f2d30834c4125CE060Bceba9863286402a"
  const walletComponents = await factory2fa(coldStorageAddr, 1000)

  console.log("Killphrase: " + walletComponents.killphrase)
  console.log("Killpharse Hash: " + walletComponents.killphraseHash)

  try {
    await fsPromises.writeFile("wallet2fa-" + walletComponents.killphraseHash.substring(0, 12) + ".json",
      JSON.stringify({ killphrase: walletComponents.killphrase, authTickets: walletComponents.authTickets }), 'utf8')
    await fsPromises.writeFile("wallet2fa-mew-fields-" + walletComponents.killphraseHash.substring(0, 12) + ".txt",
      `Byte Code:

${walletComponents.bytecode}

ABI/JSON Interface

${JSON.stringify(walletComponents.abi)}

Constructer Inputs:

_authenticator(address)
${walletComponents.authenticator}

_coldStorage(address)
${coldStorageAddr}

_killPhraseHash(bytes32)
${walletComponents.killphraseHash}

Contract Name

${walletComponents.contractName}

`, 'utf8')


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
