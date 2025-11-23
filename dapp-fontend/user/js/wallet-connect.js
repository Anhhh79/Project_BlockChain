// Wallet Connection Manager
class WalletConnection {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.balance = null;
        this.chainId = null;
        this.isConnected = false;

        this.initializeListeners();
        this.checkConnection();
    }

    initializeListeners() {
        // Connect wallet button
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connect());
        }

        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else {
                    this.handleAccountChange(accounts[0]);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });

            window.ethereum.on('disconnect', () => {
                this.disconnect();
            });
        }
    }

    async checkConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_accounts' 
                });
                
                if (accounts.length > 0) {
                    await this.setupProvider(accounts[0]);
                }
            } catch (error) {
                console.error('Error checking connection:', error);
            }
        }
    }

    async connect() {
        if (typeof window.ethereum === 'undefined') {
            this.showAlert('Vui lòng cài đặt MetaMask!', 'warning');
            window.open('https://metamask.io/download/', '_blank');
            return false;
        }

        try {
            this.showLoading(true);
            
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            await this.setupProvider(accounts[0]);
            
            this.showAlert('Kết nối ví thành công!', 'success');
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            
            if (error.code === 4001) {
                this.showAlert('Bạn đã từ chối kết nối ví', 'info');
            } else {
                this.showAlert('Lỗi kết nối ví: ' + error.message, 'danger');
            }
            
            return false;
        } finally {
            this.showLoading(false);
        }
    }

    async setupProvider(account) {
        try {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            this.account = account;
            
            // Get balance
            const balance = await this.provider.getBalance(account);
            this.balance = ethers.utils.formatEther(balance);
            
            // Get chain ID
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            
            // Check if on correct network (Conflux eSpace Testnet - Chain ID: 71)
            if (this.chainId !== 71) {
                const switched = await this.switchToConfluxNetwork();
                if (!switched) {
                    this.showAlert('Vui lòng chuyển sang mạng Conflux eSpace Testnet để sử dụng DApp', 'warning');
                    return;
                }
            }
            
            this.isConnected = true;
            
            // Initialize smart contract
            if (window.smartContract) {
                await window.smartContract.initialize(this.provider, this.signer);
            }
            
            // Update UI
            this.updateUI();
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('walletConnected', {
                detail: {
                    account: this.account,
                    balance: this.balance,
                    chainId: this.chainId
                }
            }));
            
        } catch (error) {
            console.error('Setup provider error:', error);
            throw error;
        }
    }
    
    async switchToConfluxNetwork() {
        try {
            // Try to switch to Conflux eSpace Testnet
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x47' }], // 71 in hex
            });
            return true;
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0x47',
                                chainName: 'Conflux eSpace Testnet',
                                nativeCurrency: {
                                    name: 'CFX',
                                    symbol: 'CFX',
                                    decimals: 18
                                },
                                rpcUrls: ['https://evmtestnet.confluxrpc.com'],
                                blockExplorerUrls: ['https://evmtestnet.confluxscan.io']
                            }
                        ],
                    });
                    return true;
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    return false;
                }
            }
            console.error('Error switching network:', switchError);
            return false;
        }
    }

    async handleAccountChange(newAccount) {
        this.account = newAccount;
        
        if (this.provider) {
            const balance = await this.provider.getBalance(newAccount);
            this.balance = ethers.utils.formatEther(balance);
        }
        
        this.updateUI();
        
        window.dispatchEvent(new CustomEvent('accountChanged', {
            detail: {
                account: this.account,
                balance: this.balance
            }
        }));
        
        this.showAlert('Đã chuyển tài khoản', 'info');
    }

    disconnect() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.balance = null;
        this.isConnected = false;
        
        this.updateUI();
        
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
        
        this.showAlert('Đã ngắt kết nối ví', 'info');
    }

    updateUI() {
        const connectBtn = document.getElementById('connectWalletBtn');
        const walletDisplay = document.getElementById('walletDisplay');
        const walletAddress = document.getElementById('walletAddress');
        const walletBalance = document.getElementById('walletBalance');

        if (!connectBtn) return;

        if (this.isConnected && this.account) {
            // Hide connect button, show wallet info
            connectBtn.style.display = 'none';
            
            if (walletDisplay) {
                walletDisplay.style.display = 'block';
            }
            
            if (walletAddress) {
                walletAddress.textContent = this.formatAddress(this.account);
                walletAddress.title = this.account;
            }
            
            if (walletBalance) {
                walletBalance.textContent = `${parseFloat(this.balance).toFixed(4)} ETH`;
            }
        } else {
            // Show connect button, hide wallet info
            connectBtn.style.display = 'inline-block';
            
            if (walletDisplay) {
                walletDisplay.style.display = 'none';
            }
        }
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

    async switchNetwork(chainId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.utils.hexValue(chainId) }],
            });
            return true;
        } catch (error) {
            console.error('Switch network error:', error);
            
            // Network not added
            if (error.code === 4902) {
                this.showAlert('Mạng chưa được thêm vào ví', 'warning');
            }
            
            return false;
        }
    }

    async addNetwork(networkConfig) {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig],
            });
            return true;
        } catch (error) {
            console.error('Add network error:', error);
            return false;
        }
    }

    showLoading(show) {
        const connectBtn = document.getElementById('connectWalletBtn');
        if (!connectBtn) return;

        if (show) {
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang kết nối...';
        } else {
            connectBtn.disabled = false;
            connectBtn.innerHTML = '<i class="fas fa-wallet me-2"></i>Kết nối ví';
        }
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.setAttribute('role', 'alert');
        
        const icon = {
            'success': 'fa-check-circle',
            'danger': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        alertDiv.innerHTML = `
            <i class="fas ${icon} me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    getAccount() {
        return this.account;
    }

    getBalance() {
        return this.balance;
    }

    getChainId() {
        return this.chainId;
    }

    getProvider() {
        return this.provider;
    }

    getSigner() {
        return this.signer;
    }
}

// Global disconnect function
function disconnectWallet() {
    if (window.walletConnection) {
        window.walletConnection.disconnect();
    }
}

// Initialize wallet connection
window.walletConnection = new WalletConnection();

// Export for other scripts
window.WalletConnection = WalletConnection;
