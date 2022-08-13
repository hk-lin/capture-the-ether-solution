import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("MappingChallenge", attacker);
    contract = factory.attach(`0xDCefAA407E49FD4C59F144e2E34c6F3E8fc47680`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("MappingAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address);
    await attackerContract.attack();
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});