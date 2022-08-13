import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";
const EthereumTx = require("ethereumjs-tx");

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("AccountTakeoverChallenge", attacker);
    contract = factory.attach(`0x6e029eA1dB280d46f232a19Fe35029a855D3562E`);
});

it("solves the challenge", async function () {
    let firstTransaction = await ethers.provider.getTransaction(`0xd79fc80e7b787802602f3317b7fe67765c14a7d40c3e0dcb266e63657f881396`);
    console.log(`firstTransaction`, JSON.stringify(firstTransaction, null, 4))
    let secondTransaction = await ethers.provider.getTransaction(`0x061bf0b4b5fdb64ac475795e9bc5a3978f985919ce6747ce2cfbbcaccaf51009`);
    console.log(`secondTransaction`, JSON.stringify(secondTransaction, null, 4))

    const owner = `0x6B477781b0e68031109f21887e6B5afEAaEB002b`;
    const signer = new ethers.Wallet(
        `0x614f5e36cd55ddab0947d1723693fef5456e5bee24738ba90bd33c0c6e68e269`,
        ethers.provider
    );
    expect(signer.address).to.eq(owner);
    let transaction = await contract.connect(signer).authenticate();
    await signer.provider.waitForTransaction(transaction.hash);

});

after(async function () {
    // expect(await contract.isComplete()).to.eq(true);
});