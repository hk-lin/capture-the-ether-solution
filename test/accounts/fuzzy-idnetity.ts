import {ethers} from "hardhat";
import {BigNumber, Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("FuzzyIdentityChallenge", attacker);
    contract = factory.attach(`0x3D4009B44558067e60321De3b79d3e78958A6cba`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("FuzzyIdentityAttacker", attacker);
    // let attackerContract = await factory.deploy(contract.address);
    let attackerContract = await factory.attach(`0x07E43247AB43BD4FaC225c0ED6cf14aE4DA6c6e0`);
    console.log("attacker contract address :",attackerContract.address);
    let hash = await attackerContract.initHash();
    console.log("hash of contract:",hash);
    let number = await attackerContract.successNumber();
    let zero = BigNumber.from(0);
    while(number.eq(zero)){
        let tx = await attackerContract.find(600);
        console.log("tx hash:",tx.hash);
        number = await attackerContract.successNumber();
        console.log((await attackerContract.saltNumber()).toNumber());
    }
    console.log("final salt:",number.toNumber());
    let tx = await attackerContract.attack(9445858);
    console.log("tx hash:",tx.hash);
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});