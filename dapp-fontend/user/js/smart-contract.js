// Smart Contract Configuration and Helper Functions
class SmartContract {
    constructor() {
        // Contract address - Replace với địa chỉ contract đã deploy
        this.contractAddress = '0x7fF862bAD0628e1987037294C3c4bc3d6f367471'; // Địa chỉ contract của bạn
        
        // Network configuration - Conflux eSpace Testnet
        this.networkConfig = {
            chainId: '0x47', // 71 in hex
            chainName: 'Conflux eSpace Testnet',
            nativeCurrency: {
                name: 'CFX',
                symbol: 'CFX',
                decimals: 18
            },
            rpcUrls: ['https://evmtestnet.confluxrpc.com'],
            blockExplorerUrls: ['https://evmtestnet.confluxscan.io']
        };
        
        // Load ABI
        this.contractABI = null;
        this.contract = null;
        this.provider = null;
        this.signer = null;
        
        this.loadABI();
    }

    async loadABI() {
        try {
            const response = await fetch('charityAbi.json');
            const data = await response.json();
            this.contractABI = data.abi;
        } catch (error) {
            console.error('Error loading ABI:', error);
        }
    }

    async initialize(provider, signer) {
        this.provider = provider;
        this.signer = signer;
        
        if (!this.contractABI) {
            await this.loadABI();
        }
        
        this.contract = new ethers.Contract(
            this.contractAddress,
            this.contractABI,
            signer
        );
        
        return this.contract;
    }

    // Utility functions
    formatEther(wei) {
        return ethers.utils.formatEther(wei);
    }

    parseEther(ether) {
        return ethers.utils.parseEther(ether.toString());
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('vi-VN');
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('vi-VN');
    }

    calculateDaysLeft(endDate) {
        const now = Math.floor(Date.now() / 1000);
        const secondsLeft = endDate - now;
        return Math.ceil(secondsLeft / (24 * 60 * 60));
    }

    calculateProgress(collected, target) {
        if (target === 0) return 0;
        return Math.min(Math.round((collected / target) * 100), 100);
    }

    // Campaign functions
    async getAllCampaigns() {
        try {
            if (!this.contract) {
                console.error('Contract not initialized');
                return [];
            }
            
            const campaigns = [];
            const nextId = await this.contract.nextCampaignId();
            
            for (let i = 1; i < nextId; i++) {
                try {
                    const campaign = await this.contract.campaigns(i);
                    if (campaign.id.toNumber() !== 0) {
                        campaigns.push(this.formatCampaign(campaign));
                    }
                } catch (error) {
                    console.warn(`Campaign ${i} not found or error:`, error);
                }
            }
            
            return campaigns;
        } catch (error) {
            console.error('Error getting campaigns:', error);
            return [];
        }
    }

    async getCampaign(campaignId) {
        try {
            if (!this.contract) {
                console.error('Contract not initialized');
                return null;
            }
            
            const campaign = await this.contract.campaigns(campaignId);
            
            // Check if campaign exists (id should not be 0)
            if (campaign.id.toNumber() === 0) {
                console.warn(`Campaign ${campaignId} not found`);
                return null;
            }
            
            return this.formatCampaign(campaign);
        } catch (error) {
            console.error('Error getting campaign:', error);
            return null;
        }
    }

    formatCampaign(campaign) {
        return {
            id: campaign.id.toNumber(),
            creator: campaign.creator,
            title: campaign.title,
            description: campaign.description,
            media: campaign.media,
            location: campaign.location,
            targetAmount: campaign.targetAmount,
            campaignWallet: campaign.campaignWallet,
            collected: campaign.collected,
            totalDisbursed: campaign.totalDisbursed,
            createdAt: campaign.createdAt.toNumber(),
            endDate: campaign.endDate.toNumber(),
            updatedAt: campaign.updatedAt.toNumber(),
            beneficiary: campaign.beneficiary,
            active: campaign.active,
            collectedEth: this.formatEther(campaign.collected),
            targetEth: this.formatEther(campaign.targetAmount),
            progress: this.calculateProgress(
                parseFloat(this.formatEther(campaign.collected)),
                parseFloat(this.formatEther(campaign.targetAmount))
            ),
            daysLeft: this.calculateDaysLeft(campaign.endDate.toNumber())
        };
    }

    // Donation functions
    async donate(campaignId, amountInEther) {
        try {
            const tx = await this.contract.donate(campaignId, {
                value: this.parseEther(amountInEther)
            });
            
            const receipt = await tx.wait();
            return {
                success: true,
                tx: receipt,
                txHash: receipt.transactionHash
            };
        } catch (error) {
            console.error('Error donating:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getDonations(campaignId) {
        try {
            const count = await this.contract.getDonationsCount(campaignId);
            const donations = [];
            
            for (let i = 0; i < count; i++) {
                const donation = await this.contract.getDonation(campaignId, i);
                donations.push({
                    donor: donation.donor,
                    amount: donation.amount,
                    amountEth: this.formatEther(donation.amount),
                    timestamp: donation.timestamp.toNumber(),
                    blockNumber: donation.blockNumber.toNumber(),
                    txHash: donation.txHash
                });
            }
            
            return donations;
        } catch (error) {
            console.error('Error getting donations:', error);
            return [];
        }
    }

    async getDisbursements(campaignId) {
        try {
            const count = await this.contract.getDisbursementsCount(campaignId);
            const disbursements = [];
            
            for (let i = 0; i < count; i++) {
                const disbursement = await this.contract.getDisbursement(campaignId, i);
                disbursements.push({
                    recipient: disbursement.recipient,
                    amount: disbursement.amount,
                    amountEth: this.formatEther(disbursement.amount),
                    timestamp: disbursement.timestamp.toNumber(),
                    blockNumber: disbursement.blockNumber.toNumber(),
                    txHash: disbursement.txHash
                });
            }
            
            return disbursements;
        } catch (error) {
            console.error('Error getting disbursements:', error);
            return [];
        }
    }

    async getSupporters(campaignId) {
        try {
            const supporters = await this.contract.getSupporters(campaignId);
            return supporters;
        } catch (error) {
            console.error('Error getting supporters:', error);
            return [];
        }
    }

    async getSupportersCount(campaignId) {
        try {
            const count = await this.contract.getSupportersCount(campaignId);
            return count.toNumber();
        } catch (error) {
            console.error('Error getting supporters count:', error);
            return 0;
        }
    }

    // Comment functions
    async addComment(campaignId, text, isAnonymous = false) {
        try {
            const tx = await this.contract.addComment(campaignId, text, isAnonymous);
            const receipt = await tx.wait();
            return {
                success: true,
                tx: receipt
            };
        } catch (error) {
            console.error('Error adding comment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getComments(campaignId) {
        try {
            const count = await this.contract.getCommentsCount(campaignId);
            const comments = [];
            
            for (let i = 0; i < count; i++) {
                const comment = await this.contract.getComment(campaignId, i);
                comments.push({
                    commenter: comment.commenter,
                    text: comment.text,
                    timestamp: comment.timestamp.toNumber(),
                    isAnonymous: comment.isAnonymous
                });
            }
            
            return comments;
        } catch (error) {
            console.error('Error getting comments:', error);
            return [];
        }
    }

    // Like functions
    async like(campaignId) {
        try {
            const tx = await this.contract.like(campaignId);
            const receipt = await tx.wait();
            return {
                success: true,
                tx: receipt
            };
        } catch (error) {
            console.error('Error liking:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async unlike(campaignId) {
        try {
            const tx = await this.contract.unlike(campaignId);
            const receipt = await tx.wait();
            return {
                success: true,
                tx: receipt
            };
        } catch (error) {
            console.error('Error unliking:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getLikesCount(campaignId) {
        try {
            const count = await this.contract.likesCount(campaignId);
            return count.toNumber();
        } catch (error) {
            console.error('Error getting likes count:', error);
            return 0;
        }
    }

    async isLiked(campaignId, address) {
        try {
            const liked = await this.contract.liked(campaignId, address);
            return liked;
        } catch (error) {
            console.error('Error checking liked status:', error);
            return false;
        }
    }

    // User donations
    async getUserDonations(userAddress) {
        try {
            const campaigns = await this.getAllCampaigns();
            const userDonations = [];
            
            for (const campaign of campaigns) {
                const donations = await this.getDonations(campaign.id);
                const userCampaignDonations = donations.filter(d => 
                    d.donor.toLowerCase() === userAddress.toLowerCase()
                );
                
                if (userCampaignDonations.length > 0) {
                    userDonations.push({
                        campaign: campaign,
                        donations: userCampaignDonations
                    });
                }
            }
            
            return userDonations;
        } catch (error) {
            console.error('Error getting user donations:', error);
            return [];
        }
    }

    // Currency conversion (mock - replace with real API)
    async convertToVND(ethAmount) {
        // Mock rate: 1 ETH = 50,000,000 VND
        const rate = 50000000;
        return Math.round(ethAmount * rate);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
}

// Create global instance
window.smartContract = new SmartContract();
