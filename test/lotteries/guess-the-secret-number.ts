import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let secretNumber: number;
let secret = `0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365`;
let sendValue = ethers.utils.parseEther("1");

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("GuessTheSecretNumberChallenge", attacker);
    contract = factory.attach(`0xe57537e453365613e6cb5a676D8E3B332Da6E7BA`);
    for (let i = 0; i < 256; i++) {
        const secretHash = ethers.utils.keccak256([i]);
        if (secret.includes(secretHash)) {
            secretNumber = i;
            break;
        }
    }
    console.log("secretNumber:", secretNumber);
});

it("solves the challenge", async function () {
    let tx = await contract.guess(secretNumber, {value: sendValue});
    console.log(tx.hash);
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});