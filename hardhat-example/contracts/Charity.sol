// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Blockchain Charity Platform – Transparent donation & disbursement
/// @notice Admin tạo chiến dịch, người ủng hộ donate, bình luận, thích và theo dõi sao kê trên blockchain
contract Charity {
    address public owner;

    // ---------------- Structures ----------------
    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        string media;
        string location;
        uint256 targetAmount;
        address payable campaignWallet;
        uint256 collected;
        uint256 createdAt;
        bool active;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        uint256 blockNumber;
        bytes32 txHash;
    }

    struct Disbursement {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        uint256 blockNumber;
        bytes32 txHash;
    }

    struct Comment {
        address commenter;
        string text;
        uint256 timestamp;
        bool isAnonymous;
    }

    // -------------- State variables ----------------
    uint256 public nextCampaignId = 1;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) private donations;
    mapping(uint256 => Disbursement[]) private disbursements;
    mapping(uint256 => Comment[]) private comments;

    mapping(uint256 => address[]) private supportersList;
    mapping(uint256 => mapping(address => bool)) private hasSupported;

    mapping(uint256 => mapping(address => bool)) public liked;
    mapping(uint256 => uint256) public likesCount;

    mapping(address => bool) public isAdmin;

    // -------------- Events ----------------
    event CampaignCreated(uint256 indexed id, address indexed creator);
    event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, bytes32 txHash);
    event Disbursed(uint256 indexed campaignId, address indexed recipient, uint256 amount, bytes32 txHash);
    event CommentAdded(uint256 indexed campaignId, address indexed commenter, string text);
    event Liked(uint256 indexed campaignId, address indexed liker);
    event Unliked(uint256 indexed campaignId, address indexed liker);

    // -------------- Modifiers ----------------
    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "only admin");
        _;
    }

    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
    }

    // -------------- Admin ----------------
    function setAdmin(address account, bool allowed) external onlyOwner {
        isAdmin[account] = allowed;
    }

    function createCampaign(
        string calldata title,
        string calldata description,
        string calldata media,
        string calldata location,
        uint256 targetAmount,
        address payable campaignWallet
    ) external onlyAdmin returns (uint256) {
        uint256 id = nextCampaignId++;
        campaigns[id] = Campaign({
            id: id,
            creator: msg.sender,
            title: title,
            description: description,
            media: media,
            location: location,
            targetAmount: targetAmount,
            campaignWallet: campaignWallet,
            collected: 0,
            createdAt: block.timestamp,
            active: true
        });

        emit CampaignCreated(id, msg.sender);
        return id;
    }

    // -------------- Donate ----------------
    function donate(uint256 campaignId) external payable {
        require(msg.value > 0, "donation must be > 0");
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "campaign not found");
        require(c.active, "campaign not active");

        c.collected += msg.value;

        bytes32 txHash = keccak256(abi.encodePacked(block.number, msg.sender, msg.value, block.timestamp));

        donations[campaignId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            blockNumber: block.number,
            txHash: txHash
        }));

        if (!hasSupported[campaignId][msg.sender]) {
            hasSupported[campaignId][msg.sender] = true;
            supportersList[campaignId].push(msg.sender);
        }

        if (c.campaignWallet != address(0)) {
            (bool ok, ) = c.campaignWallet.call{value: msg.value}("");
            require(ok, "forward failed");
        }

        emit DonationReceived(campaignId, msg.sender, msg.value, txHash);
    }

    // -------------- Disbursement ----------------
    function disburseFromContract(uint256 campaignId, address payable recipient, uint256 amount)
        external onlyAdmin
    {
        Campaign storage c = campaigns[campaignId];
        require(c.id != 0, "campaign not found");
        require(amount > 0, "amount must be > 0");
        require(address(this).balance >= amount, "insufficient balance");

        bytes32 txHash = keccak256(abi.encodePacked(block.number, recipient, amount, block.timestamp));

        (bool ok, ) = recipient.call{value: amount}("");
        require(ok, "transfer failed");

        disbursements[campaignId].push(Disbursement({
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            blockNumber: block.number,
            txHash: txHash
        }));

        emit Disbursed(campaignId, recipient, amount, txHash);
    }

    function setCampaignActive(uint256 campaignId, bool active) external onlyAdmin {
        campaigns[campaignId].active = active;
    }

    // -------------- Comments ----------------
    function addComment(uint256 campaignId, string calldata text, bool anon) external {
        require(campaigns[campaignId].id != 0, "campaign not found");

        comments[campaignId].push(Comment({
            commenter: msg.sender,
            text: text,
            timestamp: block.timestamp,
            isAnonymous: anon
        }));

        emit CommentAdded(campaignId, msg.sender, text);
    }

    // -------------- Likes ----------------
    function like(uint256 campaignId) external {
        require(campaigns[campaignId].id != 0, "campaign not found");
        require(!liked[campaignId][msg.sender], "already liked");

        liked[campaignId][msg.sender] = true;
        likesCount[campaignId]++;

        emit Liked(campaignId, msg.sender);
    }

    function unlike(uint256 campaignId) external {
        require(liked[campaignId][msg.sender], "not liked");

        liked[campaignId][msg.sender] = false;
        likesCount[campaignId]--;

        emit Unliked(campaignId, msg.sender);
    }

    // -------------- View Functions (Frontend Friendly) ----------------
    function getSupporters(uint256 id) external view returns (address[] memory) {
        return supportersList[id];
    }

    function getSupportersCount(uint256 id) external view returns (uint256) {
        return supportersList[id].length;
    }

    function getDonationsCount(uint256 id) external view returns (uint256) {
        return donations[id].length;
    }

    function getDonation(uint256 id, uint256 index) external view returns (Donation memory) {
        return donations[id][index];
    }

    function getDisbursementsCount(uint256 id) external view returns (uint256) {
        return disbursements[id].length;
    }

    function getDisbursement(uint256 id, uint256 index) external view returns (Disbursement memory) {
        return disbursements[id][index];
    }

    function getCommentsCount(uint256 id) external view returns (uint256) {
        return comments[id].length;
    }

    function getComment(uint256 id, uint256 index) external view returns (Comment memory) {
        return comments[id][index];
    }

    // -------------- Receive Donation without specifying campaign ----------------
    receive() external payable {}
    fallback() external payable {}
}
