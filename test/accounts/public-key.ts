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
    const factory = await ethers.getContractFactory("PublicKeyChallenge", attacker);
    contract = factory.attach(`0xB86f59222936AdE80144E5bd55be318864713D9d`);
});

it("solves the challenge", async function () {
    let firstTxHash = "0xabc467bedd1d17462fcc7942d0af7874d6f8bdefee2b299c9168a216d3ff0edb";
    let firstTx = await ethers.provider.getTransaction(firstTxHash);
    expect(firstTx).not.to.be.undefined;
    console.log(`firstTx`, JSON.stringify(firstTx, null, 4));
    let txData = {
        gasPrice: firstTx.gasPrice,
        gasLimit: firstTx.gasLimit,
        value: firstTx.value,
        nonce: firstTx.nonce,
        data: firstTx.data,
        to: firstTx.to,
        chainId: firstTx.chainId,
    };
    let signingData = ethers.utils.serializeTransaction(txData);
    let msgHash = ethers.utils.keccak256(signingData);
    let signature = { s: firstTx.s,r: firstTx.r == undefined?"":firstTx.r, v: firstTx.v };
    let rawPublicKey = ethers.utils.recoverPublicKey(msgHash, signature);
    expect(rawPublicKey.slice(2, 4), "not a raw public key").to.equal(`04`);
    rawPublicKey = `0x${rawPublicKey.slice(4)}`;
    console.log(`Recovered public key ${rawPublicKey}`);
    let tx = await contract.authenticate(rawPublicKey);
    console.log("transaction hash:",tx.hash);


});

after(async function () {
    expect(await contract.isComplete()).to.eq(true);
});