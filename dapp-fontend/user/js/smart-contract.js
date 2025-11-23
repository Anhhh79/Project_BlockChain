// Smart Contract Integration for User Page
// Contract Address on Conflux eSpace Testnet (chain-71)
const CONTRACT_ADDRESS = '0x7fF862bAD0628e1987037294C3c4bc3d6f367471';

// Load full ABI from separate file
let CHARITY_ABI = null;

// Load ABI from charityAbi.json
async function loadABI() {
    try {
        // Try to load from user folder first
        let response = await fetch('../admin/charityAbi.json');
        if (!response.ok) {
            // Fallback to relative path
            response = await fetch('./charityAbi.json');
        }
        const data = await response.json();
        CHARITY_ABI = data.abi || data;
        console.log('ABI loaded successfully');
        return CHARITY_ABI;
    } catch (error) {
        console.error('Error loading ABI:', error);
        // Use minimal ABI as fallback
        CHARITY_ABI = [
            "function donate(uint256 campaignId) external payable",
            "function campaigns(uint256) external view returns (uint256 id, address creator, string title, string description, string media, string location, uint256 targetAmount, address campaignWallet, uint256 collected, uint256 totalDisbursed, uint256 createdAt, uint256 endDate, uint256 updatedAt, string beneficiary, bool active)",
            "function nextCampaignId() external view returns (uint256)",
            "function getCampaignDetails(uint256 id) external view returns (uint256 _id, string title, uint256 targetAmount, uint256 collected, uint256 totalDisbursed, uint256 endDate, bool active, bool expired)",
            "function getDonationsCount(uint256 id) external view returns (uint256)",
            "function getDonation(uint256 id, uint256 index) external view returns (address donor, uint256 amount, uint256 timestamp, uint256 blockNumber, bytes32 txHash)",
            "function getSupportersCount(uint256 id) external view returns (uint256)",
            "function getCommentsCount(uint256 id) external view returns (uint256)",
            "function getComment(uint256 id, uint256 index) external view returns (address commenter, string text, uint256 timestamp, bool isAnonymous)",
            "function like(uint256 campaignId) external",
            "function unlike(uint256 campaignId) external",
            "function liked(uint256, address) external view returns (bool)",
            "function likesCount(uint256) external view returns (uint256)",
            "function addComment(uint256 campaignId, string text, bool anon) external",
            "event DonationReceived(uint256 indexed campaignId, address indexed donor, uint256 amount, bytes32 txHash)",
            "event CampaignCreated(uint256 indexed id, address indexed creator)",
            "event Liked(uint256 indexed campaignId, address indexed liker)",
            "event Unliked(uint256 indexed campaignId, address indexed liker)",
            "event CommentAdded(uint256 indexed campaignId, address indexed commenter, string text)"
        ];
        return CHARITY_ABI;
    }
}

let contract = null;
let contractWithSigner = null;

// Initialize contract when wallet is connected
async function initializeContract() {
    try {
        // Load ABI first if not loaded
        if (!CHARITY_ABI) {
            await loadABI();
        }

        if (!window.walletConnection || !window.walletConnection.getProvider()) {
            console.log('Wallet not connected, waiting...');
            return null;
        }

        const provider = window.walletConnection.getProvider();
        const signer = window.walletConnection.getSigner();

        if (!provider || !signer) {
            console.log('Provider or signer not available');
            return null;
        }

        // Initialize read-only contract
        contract = new ethers.Contract(CONTRACT_ADDRESS, CHARITY_ABI, provider);
        
        // Initialize contract with signer for transactions
        contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, CHARITY_ABI, signer);

        console.log('Contract initialized:', CONTRACT_ADDRESS);
        return { contract, contractWithSigner };
    } catch (error) {
        console.error('Error initializing contract:', error);
        return null;
    }
}

// Get campaign count from smart contract
async function getCampaignCount() {
    try {
        if (!contract) {
            await initializeContract();
        }

        if (!contract) {
            throw new Error('Contract not initialized');
        }

        const count = await contract.nextCampaignId();
        return count.toNumber() - 1; // nextCampaignId starts from 1
    } catch (error) {
        console.error('Error getting campaign count:', error);
        return 0;
    }
}

// Get campaign info from smart contract
async function getCampaignInfo(campaignId) {
    try {
        if (!contract) {
            await initializeContract();
        }

        if (!contract) {
            throw new Error('Contract not initialized');
        }

        const campaign = await contract.campaigns(campaignId);
        
        return {
            id: campaign.id.toNumber(),
            creator: campaign.creator,
            title: campaign.title,
            description: campaign.description,
            media: campaign.media,
            location: campaign.location,
            targetAmount: ethers.utils.formatEther(campaign.targetAmount),
            campaignWallet: campaign.campaignWallet,
            collected: ethers.utils.formatEther(campaign.collected),
            totalDisbursed: ethers.utils.formatEther(campaign.totalDisbursed),
            createdAt: new Date(campaign.createdAt.toNumber() * 1000),
            endDate: campaign.endDate.toNumber() > 0 ? new Date(campaign.endDate.toNumber() * 1000) : null,
            updatedAt: new Date(campaign.updatedAt.toNumber() * 1000),
            beneficiary: campaign.beneficiary,
            active: campaign.active
        };
    } catch (error) {
        console.error('Error getting campaign info:', error);
        throw error;
    }
}

// Get all campaigns from smart contract
async function getAllCampaigns() {
    try {
        if (!contract) {
            await initializeContract();
        }

        const nextId = await contract.nextCampaignId();
        const campaigns = [];

        for (let i = 1; i < nextId.toNumber(); i++) {
            try {
                const info = await getCampaignInfo(i);
                // Only show active campaigns to users
                if (info.active) {
                    // Get additional info
                    const likesCount = await contract.likesCount(i);
                    const supportersCount = await contract.getSupportersCount(i);
                    
                    campaigns.push({
                        ...info,
                        likesCount: likesCount.toNumber(),
                        supportersCount: supportersCount.toNumber()
                    });
                }
            } catch (error) {
                console.error(`Error loading campaign ${i}:`, error);
            }
        }

        return campaigns;
    } catch (error) {
        console.error('Error getting all campaigns:', error);
        return [];
    }
}

// Donate to a campaign
async function donateToContract(campaignId, amountInCFX) {
    try {
        if (!contractWithSigner) {
            await initializeContract();
        }

        if (!contractWithSigner) {
            throw new Error('Contract not initialized. Please connect your wallet first.');
        }

        // Convert amount to Wei
        const amountInWei = ethers.utils.parseEther(amountInCFX.toString());

        console.log(`Donating ${amountInCFX} CFX to campaign ${campaignId}...`);

        // Send transaction
        const tx = await contractWithSigner.donate(campaignId, {
            value: amountInWei,
            gasLimit: 300000 // Set a reasonable gas limit
        });

        console.log('Transaction sent:', tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        return {
            success: true,
            transactionHash: tx.hash,
            receipt: receipt
        };

    } catch (error) {
        console.error('Error donating to contract:', error);
        
        let errorMessage = 'Có lỗi xảy ra khi thực hiện giao dịch';
        
        if (error.code === 4001) {
            errorMessage = 'Bạn đã từ chối giao dịch';
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = 'Số dư không đủ để thực hiện giao dịch';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

// Exchange rate management
let CFX_TO_VND_RATE = 70000000; // Default: 1 CFX = 70,000,000 VND
let lastRateFetchTime = 0;
const RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get CFX to VND exchange rate (can be updated to use real API)
async function getCFXtoVNDRate() {
    const now = Date.now();
    if (CFX_TO_VND_RATE > 0 && (now - lastRateFetchTime) < RATE_CACHE_DURATION) {
        return CFX_TO_VND_RATE;
    }
    
    // TODO: Implement real exchange rate API
    // For now, use fixed rate
    CFX_TO_VND_RATE = 70000000;
    lastRateFetchTime = now;
    return CFX_TO_VND_RATE;
}

// Convert VND to CFX
function convertVNDtoCFX(amountVND) {
    return amountVND / CFX_TO_VND_RATE;
}

// Convert CFX to VND
function convertCFXtoVND(amountCFX) {
    return amountCFX * CFX_TO_VND_RATE;
}

// Format currency
function formatCurrency(amount, currency = 'VND') {
    if (currency === 'VND') {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    } else if (currency === 'CFX') {
        return `${parseFloat(amount).toFixed(4)} CFX`;
    }
    return amount.toString();
}

// Export functions
window.smartContract = {
    CONTRACT_ADDRESS,
    loadABI,
    initializeContract,
    getCampaignCount,
    getCampaignInfo,
    getAllCampaigns,
    donateToContract,
    getCFXtoVNDRate,
    convertVNDtoCFX,
    convertCFXtoVND,
    formatCurrency,
    getContract: () => contract,
    getContractWithSigner: () => contractWithSigner
};

// Auto-load ABI on module load
(async () => {
    await loadABI();
    console.log('Smart contract module loaded with ABI');
})();
