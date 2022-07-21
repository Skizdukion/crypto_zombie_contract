/* eslint-disable no-process-exit */
// yarn hardhat node
// yarn hardhat run scripts/readPrice.js --network localhost
const { ethers } = require("hardhat");

async function main() {
  accounts = await ethers.getSigners();
  const cryptoZombieContract = await ethers.getContract("CryptoZombie", accounts[1]);
  const addNewZombie = await cryptoZombieContract.createRandomZombie("yoink");
  const totalZombie = await cryptoZombieContract.getTotalZombie();
  console.log(totalZombie.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
