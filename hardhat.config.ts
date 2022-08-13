import dotenv from "dotenv";
import {task, HardhatUserConfig} from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "./tasks/index";
import {LOADIPHLPAPI} from "dns";

dotenv.config(); // load env vars from .env
const {ROPSTEN_URL, MNEMONIC} = process.env;

if (!ROPSTEN_URL)
    throw new Error(
        `ROPSTEN_URL env var not set. Copy .env.template to .env and set the env var`
    );

if (!MNEMONIC)
    throw new Error(
        `MNEMONIC env var not set. Copy .env.template to .env and set the env var`
    );

const accounts = {
    // derive accounts from mnemonic, see tasks/create-key
    mnemonic: MNEMONIC,
};

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            // old ethernaut compiler
            {version: "0.4.21"},
            {version: "0.7.3"},
            {version: "0.8.9"},
            {version: "0.5.16"}
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        ropsten: {
            url: ROPSTEN_URL,
            accounts: accounts,
        },
        hardhat: {
            accounts: accounts,
            forking: {
                url: ROPSTEN_URL, // https://ropsten.infura.io/v3/SECRET`,
                blockNumber: 12771500,
            },
        },
    },
    mocha: {
        timeout: 400 * 1e3,
    }
};
export default config;
