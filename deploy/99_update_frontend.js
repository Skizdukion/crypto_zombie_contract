const { ethers, network } = require("hardhat");
const fs = require("fs");
const { getContractAddress } = require("ethers/lib/utils");

// const FRONT_END_ADDRESS_FILE =
//   "../front-end-html/constants/contractAddresses.json";
// const FRONT_END_ABI_FILE =
//   "../front-end-html/constants/abi.json";

module.exports = async function () {
  // if (process.env.UPDATE_FRONT_END) {
  //   console.log("Updating front end enviroment");
  //   await updateContractAddresses();
  //   await updateAbi();
  // }
};

// async function updateContractAddresses() {
//   console.log("Updating contract address");
//   const zbo = await ethers.getContract("CryptoZombie");
//   const chainId = network.config.chainId.toString();
//   const currentAddress = JSON.parse(
//     fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8")
//   );
//   if (chainId in currentAddress) {
//     if (!currentAddress[chainId].includes(zbo.address)) {
//       currentAddress[chainId].push(zbo.address);
//     }
//   } else {
//     currentAddress[chainId] = [zbo.address];
//   }
//   fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddress));
//   console.log("Updating contract address finish");
// }

// async function updateAbi() {
//   console.log("Updating contract abi");
//   const zbo = await ethers.getContract("CryptoZombie");
//   fs.writeFileSync(
//     FRONT_END_ABI_FILE,
//     zbo.interface.format(ethers.utils.FormatTypes.json)
//   );
//   console.log("Updating contract abi finish");
// }

module.exports.tags = ["all", "front-end"];
