import {ethers} from "hardhat";
import {Contract, Signer} from "ethers";
import {expect} from "chai";
import {formatBytes32String} from "@ethersproject/strings";

let accounts: Signer[];
let attacker: Signer;
let registry: Contract, challange: Contract; // challenge contract

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const challangeFactory = await ethers.getContractFactory("NicknameChallenge", attacker);
    challange = challangeFactory.attach("0x05902BA45CdD85f9445E09FE41fc695DdD310Ba7");
    const registryFactory = await ethers.getContractFactory("CaptureTheEther", attacker);
    registry = registryFactory.attach("0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee");
});

it("solves the challenge", async function () {
    await registry.setNickname(formatBytes32String("linmiaomiao"));
});

after(async function () {
    expect(await challange.isComplete()).to.eq(true);
});