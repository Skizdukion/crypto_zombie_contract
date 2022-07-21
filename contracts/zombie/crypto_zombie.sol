// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CryptoZombie is
    Ownable,
    VRFConsumerBaseV2,
    ERC721,
    ERC721Enumerable,
    Pausable
{
    enum RandomAction {
        NONE,
        CREATEZOMBIE,
        BATTLE
    }

    event NewZombie(uint zombieId, uint dna);
    event RequestRandom(uint requestId);
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;
    uint public MAX_SUPPLY = 10000;

    uint dnaDigits = 16;
    uint dnaModulus = 10**dnaDigits;
    uint cooldownTime = 1 days;
    uint levelUpFee = 0.001 ether;
    uint randNonce = 0;
    uint attackVictoryProbability = 70;
    uint[] tempRand;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    RandomAction rAction;

    struct Zombie {
        uint256 id;
        uint dna;
        uint32 level;
        uint32 readyTime;
        uint16 winCount;
        uint16 lossCount;
    }

    Zombie[] public zombies;

    // mapping(uint => address) public zombieToOwner;
    // mapping(address => uint) public ownerZombieCount;

    // mapping(uint => address) zombieApprovals;

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Zombie NFT", "ZN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        rAction = RandomAction.NONE;
        i_callbackGasLimit = callbackGasLimit;
        _tokenIdCounter.increment();
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // KittyInterface kittyContract;

    modifier onlyOwnerOf(uint _zombieIndexId) {
        // require(msg.sender == zombieToOwner[_zombieId]);
        require(msg.sender == ownerOf(zombies[_zombieIndexId].id));
        _;
    }

    modifier aboveLevel(uint _level, uint _zombieId) {
        require(zombies[_zombieId].level >= _level);
        _;
    }

    function _createZombie(
        uint _dna,
        uint id,
        address /* _owner */
    ) internal {
        zombies.push(
            Zombie(id, _dna, 1, uint32(block.timestamp + cooldownTime), 0, 0)
        );
        // ownerZombieCount[_owner] = ownerZombieCount[_owner] + 1;
        emit NewZombie(id, _dna);
    }

    // @notice: this should use when want to make create zombie truly randomize
    // function createRandomZombie() public {
    //     require(ownerZombieCount[msg.sender] == 0);
    //     rAction = RandomAction.CREATEZOMBIE;
    //     uint requestId = i_vrfCoordinator.requestRandomWords(
    //         i_gasLane,
    //         i_subscriptionId,
    //         REQUEST_CONFIRMATIONS,
    //         i_callbackGasLimit,
    //         NUM_WORDS
    //     );
    //     emit RequestRandom(requestId);
    // }

    // @notice: replace for faster development
    function createRandomZombie() public {
        require(
            balanceOf(msg.sender) == 0,
            "This account have more then 0 zombie"
        );
        require(totalSupply() < MAX_SUPPLY, "Can't mint anymore NFT.");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        uint rand = randMod(dnaModulus);
        _createZombie(rand, tokenId, msg.sender);
    }

    function getTotalZombie() public view returns (uint256) {
        return zombies.length;
    }

    function _triggerCooldown(Zombie storage _zombie) internal {
        _zombie.readyTime = uint32(block.timestamp + cooldownTime);
    }

    function _isReady(Zombie storage _zombie) internal view returns (bool) {
        return (_zombie.readyTime <= block.timestamp);
    }

    function feedAndMultiply(
        uint _zombieIndexId,
        uint _targetDna,
        string memory /* _species */
    ) internal onlyOwnerOf(_zombieIndexId) {
        Zombie storage myZombie = zombies[_zombieIndexId];
        require(_isReady(myZombie));
        _targetDna = _targetDna % dnaModulus;
        uint newDna = (myZombie.dna + _targetDna) / 2;
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _createZombie(tokenId, newDna, msg.sender);
        _triggerCooldown(myZombie);
    }

    function setLevelUpFee(uint _fee) external onlyOwner {
        levelUpFee = _fee;
    }

    function levelUp(uint _zombieId) external payable {
        require(msg.value == levelUpFee);
        zombies[_zombieId].level = zombies[_zombieId].level + 1;
    }

    function changeDna(uint _zombieIndexId, uint _newDna)
        external
        aboveLevel(20, _zombieIndexId)
        onlyOwnerOf(_zombieIndexId)
    {
        zombies[_zombieIndexId].dna = _newDna;
    }

    function getZombiesByOwner(address _owner)
        external
        view
        returns (uint[] memory)
    {
        uint[] memory result = new uint[](balanceOf(_owner));
        uint counter = 0;
        for (uint i = 0; i < zombies.length; i++) {
            if (ownerOf(zombies[i].id) == _owner) {
                result[counter] = zombies[i].id;
                counter++;
            }
        }
        return result;
    }

    function randMod(uint _modulus) internal returns (uint) {
        randNonce = randNonce + 1;
        return
            uint(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.number,
                        msg.sender,
                        randNonce
                    )
                )
            ) % _modulus;
    }

    function attack(uint _zombieIndexId, uint _targetIndexId)
        external
        onlyOwnerOf(_zombieIndexId)
    {
        Zombie storage myZombie = zombies[_zombieIndexId];
        Zombie storage enemyZombie = zombies[_targetIndexId];
        uint rand = randMod(100);
        if (rand <= attackVictoryProbability) {
            myZombie.winCount = myZombie.winCount + 1;
            myZombie.level = myZombie.level + 1;
            enemyZombie.lossCount = enemyZombie.lossCount + 1;
            feedAndMultiply(_zombieIndexId, enemyZombie.dna, "zombie");
        } else {
            myZombie.lossCount = myZombie.lossCount + 1;
            enemyZombie.winCount = enemyZombie.winCount + 1;
            _triggerCooldown(myZombie);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    // function balanceOf(address _owner) external view returns (uint256) {
    //     return ownerZombieCount[_owner];
    // }

    // function ownerOf(uint256 _tokenId) external view returns (address) {
    //     return zombieToOwner[_tokenId];
    // }

    // function _transfer(
    //     address, /*_from */
    //     address _to,
    //     uint256 _tokenId
    // ) private {
    //     ownerZombieCount[_to] = ownerZombieCount[_to] + 1;
    //     ownerZombieCount[msg.sender] = ownerZombieCount[msg.sender] - 1;
    //     zombieToOwner[_tokenId] = _to;
    //     // emit Transfer(_from, _to, _tokenId);
    // }

    // function transferFrom(
    //     address _from,
    //     address _to,
    //     uint256 _tokenId
    // ) external payable {
    //     require(
    //         zombieToOwner[_tokenId] == msg.sender ||
    //             zombieApprovals[_tokenId] == msg.sender
    //     );
    //     _transfer(_from, _to, _tokenId);
    // }

    // function approve(address _approved, uint256 _tokenId)
    //     external
    //     payable
    //     onlyOwnerOf(_tokenId)
    // {
    //     zombieApprovals[_tokenId] = _approved;
    //     // emit Approval(msg.sender, _approved, _tokenId);
    // }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // function _afterTokenTransfer(
    //     address from,
    //     address to,
    //     uint256 /*tokenId*/
    // ) internal override whenNotPaused {
    //     ownerZombieCount[to] = ownerZombieCount[to] + 1;
    //     ownerZombieCount[msg.sender] = ownerZombieCount[msg.sender] - 1;
    // }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        // if (rAction == RandomAction.CREATEZOMBIE) {
        // }
        // _createZombie(randomWords[0] % dnaModulus);
    }
}
