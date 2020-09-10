//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import "./ECDSA.sol";
import "./RevertMessage.sol";
import "@nomiclabs/buidler/console.sol";

contract Wallet2fa {
    address public controller;
    address payable public coldStorage;
    address authenticator;
    bytes32 killPhraseHash;
    uint256 public nonce;

    struct MetaTx {
        address to;
        uint256 value;
        bytes data;
    }

    constructor(
        address _authenticator,
        address payable _coldStorage,
        bytes32 _killPhraseHash
    ) public {
        controller = msg.sender;
        authenticator = _authenticator;
        coldStorage = _coldStorage;
        killPhraseHash = _killPhraseHash;
        nonce = 0;
    }

    receive() external payable {}

    // function testHashedNonce() public view returns (bytes32) {
    //     return keccak256(abi.encodePacked(nonce));
    // }

    // function testPackedNonce() public view returns (bytes memory) {
    //     return abi.encodePacked(bytes32(nonce));
    // }

    //only controller
    function execute(MetaTx memory _metaTx, bytes memory _authSignature)
        public
        returns (bool, bytes memory)
    {
        require(
            msg.sender == controller,
            "Only controller is allowed to execute transactions"
        );

        //Add chainId for replay protection?
        bytes32 hashedNonce = keccak256(abi.encodePacked(nonce));

        address signer = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(hashedNonce),
            _authSignature
        );

        require(
            signer == authenticator,
            "Authenticator did not sign the current nonce."
        );

        bool success;
        bytes memory returnData;
        (success, returnData) = _metaTx.to.call{value: _metaTx.value}(
            abi.encodePacked(_metaTx.data)
        );
        if (!success) {
            RevertMessage.emitRevert(returnData);
        }
        if (success) {
            nonce = nonce + 1;
        }
        return (success, returnData);
    }

    //any one can call this
    function kill(string memory _killPhrase) public {
        //verify sha3(_killPhrase) = killPhraseHash
        require(
            killPhraseHash == keccak256(abi.encodePacked(_killPhrase)),
            "Killphrase not valid"
        );

        selfdestruct(coldStorage);
    }
}
