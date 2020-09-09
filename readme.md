# Ether 2fa Wallet

A simple implemenation of a multisig wallet which uses 2 accounts:

- A controller account with medium level security (e.g. Metamask)
- An ephermeral account which signs wallet nonce's to generate auth tickets and whose private key is subsequently destroyed