const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { numToBytes32 } = require("@chainlink/test-helpers/dist/src/helpers");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Create Zombie test", async function () {
      let cryptoZombieContract, vrfCoordinatorV2Mock;
      let deployer;
      let alice;
      let bob;
      let lilpunk;
      beforeEach(async () => {
        // deployer = (await getNamedAccounts()).deployer;
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        alice = accounts[1];
        bob = accounts[2];
        lilpunk = accounts[3];
        await deployments.fixture(["all"]);
        cryptoZombieContract = await ethers.getContract(
          "CryptoZombie",
          deployer
        );
        // vrfCoordinatorV2Mock = await ethers.getContract(
        //   "VRFCoordinatorV2Mock",
        //   deployer
        // );
      });
      // describe("create zombie", async function () {
      //   it("just one", async function () {
      //     // await new Promise(async (reslove, reject) => {
      //     //   cryptoZombieContract.once("NewZombie", async () => {
      //     //     const zombieCount = await cryptoZombieContract.getTotalZombie();
      //     //     assert.equal(zombieCount.toString(), "1");
      //     //   });

      //     // });
      //     await new Promise(async (resolve, reject) => {
      //       cryptoZombieContract.once("NewZombie", async () => {
      //         console.log("Create new random zombie");
      //         try {
      //           const zombieCount = await cryptoZombieContract.getTotalZombie();
      //           assert.equal(zombieCount.toString(), "1");
      //         } catch (e) {
      //           reject(e);
      //         }
      //         resolve();
      //       });
      //       const tx = await cryptoZombieContract.createRandomZombie();
      //       const txReceipt = await tx.wait();
      //       console.log(txReceipt.events[1].args.requestId);
      //       await vrfCoordinatorV2Mock.fulfillRandomWords(
      //         txReceipt.events[1].args.requestId,
      //         cryptoZombieContract.address
      //       );
      //     });
      //   });
      // });

      describe("create zombie", async function () {
        it("should be able to create one zombie with one account", async function () {
          const tx = await cryptoZombieContract.createRandomZombie();
          const result = await tx.wait();
          const zombieCount = await cryptoZombieContract.getTotalZombie();
          assert.equal(zombieCount.toString(), "1");
          let deployerZombieId = await cryptoZombieContract.getZombiesByOwner(
            deployer.address
          );
          assert.equal(
            deployer.address,
            await cryptoZombieContract.ownerOf(deployerZombieId[0].toString())
          );
          // assert.equal(
          //   (
          //     await cryptoZombieContract.ownerZombieCount(deployer.address)
          //   ).toString(),
          //   "1"
          // );
        });

        it("shouldn't be able to create more than one zombie with one account", async function () {
          const tx = await cryptoZombieContract.createRandomZombie();
          await tx.wait();
          await expect(cryptoZombieContract.createRandomZombie()).to.be
            .reverted;
        });

        it("should be able to create multiple with multiple accounts", async function () {
          accounts = await ethers.getSigners();
          for (let i = 0; i < 10; i++) {
            let cryptoZombieWithAccountIndex;
            cryptoZombieWithAccountIndex = await ethers.getContract(
              "CryptoZombie",
              accounts[i]
            );
            const tx = await cryptoZombieWithAccountIndex.createRandomZombie();
            const result = await tx.wait();
          }
          const zombieCount = await cryptoZombieContract.getTotalZombie();
          assert.equal(zombieCount.toString(), "10");
        });
      });

      describe("transfer nft", async () => {
        let aliceWithContract;
        let bobWithContract;
        let lilpunkWithContract;
        beforeEach(async () => {
          aliceWithContract = await ethers.getContract("CryptoZombie", alice);
          bobWithContract = await ethers.getContract("CryptoZombie", bob);
          lilpunkWithContract = await ethers.getContract(
            "CryptoZombie",
            lilpunk
          );
          await cryptoZombieContract.createRandomZombie();
          await bobWithContract.createRandomZombie();
          await aliceWithContract.createRandomZombie();
          await lilpunkWithContract.createRandomZombie();
        });
        it("should work, transfer from alice to deployer", async () => {
          // console.log(aliceFirstZombieId);
          // console.log(alice.address);
          // console.log(await aliceWithContract.ownerOf(aliceFirstZombieId));
          let aliceZombieId = await aliceWithContract.getZombiesByOwner(
            alice.address
          );
          
          console.log(
            "before transfer: alice zb count " +
              (await cryptoZombieContract.balanceOf(alice.address)).toString() +
              " deployer zb count " +
              (
                await cryptoZombieContract.balanceOf(deployer.address)
              ).toString()
          );

          await aliceWithContract.transferFrom(
            alice.address,
            deployer.address,
            aliceZombieId[0].toString()
          );

          assert.equal(
            deployer.address,
            await aliceWithContract.ownerOf(aliceZombieId[0].toString())
          );

          console.log(
            "after transfer: alice zb count " +
              (await cryptoZombieContract.balanceOf(alice.address)).toString() +
              " deployer zb count " +
              (
                await cryptoZombieContract.balanceOf(deployer.address)
              ).toString()
          );

          console.log(
            await cryptoZombieContract.getZombiesByOwner(deployer.address)
          );
        });
      });

      describe("zombie attack function", async () => {
        let aliceWithContract;
        let bobWithContract;
        let lilpunkWithContract;
        beforeEach(async () => {
          aliceWithContract = await ethers.getContract("CryptoZombie", alice);
          bobWithContract = await ethers.getContract("CryptoZombie", bob);
          lilpunkWithContract = await ethers.getContract(
            "CryptoZombie",
            lilpunk
          );
          await cryptoZombieContract.createRandomZombie();
          await bobWithContract.createRandomZombie();
          await aliceWithContract.createRandomZombie();
          await lilpunkWithContract.createRandomZombie();
        });
        it("should work, transfer from alice to deployer", async () => {
          // console.log(aliceFirstZombieId);
          // console.log(alice.address);
          // console.log(await aliceWithContract.ownerOf(aliceFirstZombieId));
          let aliceZombieId = await aliceWithContract.getZombiesByOwner(
            alice.address
          );

          console.log(
            "before transfer: alice zb count " +
              (await cryptoZombieContract.balanceOf(alice.address)).toString() +
              " deployer zb count " +
              (
                await cryptoZombieContract.balanceOf(deployer.address)
              ).toString()
          );

          await aliceWithContract.transferFrom(
            alice.address,
            deployer.address,
            aliceZombieId[0].toString()
          );

          assert.equal(
            deployer.address,
            await aliceWithContract.ownerOf(aliceZombieId[0].toString())
          );

          console.log(
            "after transfer: alice zb count " +
              (await cryptoZombieContract.balanceOf(alice.address)).toString() +
              " deployer zb count " +
              (
                await cryptoZombieContract.balanceOf(deployer.address)
              ).toString()
          );

          console.log(
            await cryptoZombieContract.getZombiesByOwner(deployer.address)
          );
        });
      });
    });
