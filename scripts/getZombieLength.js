/* eslint-disable no-process-exit */
// yarn hardhat node
// yarn hardhat run scripts/readPrice.js --network localhost
const { ethers } = require("hardhat");

async function main() {
  const cryptoZombieContract = await ethers.getContract("CryptoZombie");
  const totalZombie = await cryptoZombieContract.getTotalZombie();
  console.log("Contract Address: " + cryptoZombieContract.address);
  console.log(totalZombie.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
