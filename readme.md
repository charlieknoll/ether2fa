# Ether 2fa Wallet

WARNING! This is experimental, by using this software you assume all risk including complete loss of funds!

A simple implemenation of a multisig wallet which uses 2 accounts:

- A controller account with medium level security (e.g. Metamask)
- An ephermeral account which signs wallet nonce's to generate auth tickets and whose private key is subsequently destroyed

## Usage

- TODO

## Issues

- If an attacker is running a node and monitoring the mempool for tx's sent to the 2fa Wallet, the attacker could intercept the auth ticket and if they had the private key of the controller account, could create a new tx using the auth ticket and drain the wallet.

## Dev Todo

- WIP: Build auth ticket generator script
- Build QR offline web page
- Test on BDLR-node
- Build management dapp
- Test on ropsten
- Migrate to ipfs
- "Enhance" metamask to support read-only accounts, intercept signed tx?  (WalletConnect instead?)

## Feature Todo

- To improve security, add an approve (to, value, contract method, contract params?)
- Refund gas used to controller? would this cost too much gas?


## Testing Todo