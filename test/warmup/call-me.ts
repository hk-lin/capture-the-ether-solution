import {ethers} from "hardhat";
import {BigNumber, Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("CallMeChallenge");
    contract = factory.attach(`0x7e82aa07450C7CE6804bCb134c1c8f26d68755F0`);
});

it("solves the challenge", async function () {
    const tx = await contract.connect(attacker).callme();
    const txHash = tx.hash;
    expect(txHash).to.not.be.undefined;
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});