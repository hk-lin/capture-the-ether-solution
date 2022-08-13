pragma solidity =0.8.9;

interface IFuzzyIdentityChallenge {
    function isComplete() external view returns (bool);

    function authenticate() external payable;
}


contract FuzzyIdentityAttacker {
    address public challenge;
    bytes32 public initHash;
    uint256 public saltNumber;
    bytes20 constant id = hex"000000000000000000000000000000000badc0de";
    bytes20 constant mask = hex"000000000000000000000000000000000fffffff";
    uint256 public successNumber;

    constructor (address challengeAddress) {
        challenge = challengeAddress;
        initHash = keccak256(type(FuzzContract).creationCode);
        saltNumber = 0;
        successNumber = 0;
    }
    function find(uint256 number) external {
        uint256 i = saltNumber;
        saltNumber += number;
        while(i < saltNumber) {
            bytes32 salt = bytes32(i);
            address predictedAddress = address(uint160(uint256(keccak256(abi.encodePacked(hex"ff", address(this), salt, initHash)))));
            if (isBadCode(bytes20(predictedAddress))) {
                bytes memory bytecode = type(FuzzContract).creationCode;
                address success;
                assembly {
                    success := create2(0, add(bytecode, 32), mload(bytecode), salt)
                }
                FuzzContract(success).done(address(challenge));
                successNumber = i;
                break;
            }
            i ++;
        }
    }

    function attack(uint256 number) external {
        bytes32 salt = bytes32(number);
        bytes memory bytecode = type(FuzzContract).creationCode;
        address success;
        assembly {
            success := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        FuzzContract(success).done(address(challenge));
    }

    function isBadCode(bytes20 add) internal pure returns (bool) {
        for (uint256 i = 0; i < 34; i++) {
            if (add & mask == id) {
                return true;
            }
            add >>= 4;
        }
        return false;
    }

    receive() external payable {}
}

contract FuzzContract {

    function done(address challengeAddress) external {
        IFuzzyIdentityChallenge(challengeAddress).authenticate();
        selfdestruct(payable(msg.sender));
    }

    function name() external pure returns (bytes32) {
        return bytes32("smarx");
    }
}