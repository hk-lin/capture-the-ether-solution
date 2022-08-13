// https://capturetheether.com/challenges/warmup/call-me/
import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("GuessTheNumberChallenge", attacker);
    contract = factory.attach(`0x14857141f3d1b36B647cae5067e1b64Ba7c9aD73`);
});

it("solves the challenge", async function () {
    await contract.guess(42, {value: ethers.utils.parseEther('1')});
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});