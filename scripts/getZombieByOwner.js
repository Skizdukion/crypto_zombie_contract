/* eslint-disable no-process-exit */
// yarn hardhat node
// yarn hardhat run scripts/readPrice.js --network localhost
const { ethers } = require("hardhat");

async function main() {
  const cryptoZombieContract = await ethers.getContract("CryptoZombie");
  const deployer = (await getNamedAccounts()).deployer;
  const totalZombie = await cryptoZombieContract.getZombiesByOwner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("Contract Address: " + cryptoZombieContract.address);
  console.log(totalZombie);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
