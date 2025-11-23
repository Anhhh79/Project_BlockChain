// Wallet Connection Handler for Index Page
let currentAccount = null;
let provider = null;
let signer = null;

// Initialize wallet connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const walletAddress = document.getElementById('walletAddress');

    // ✅ ENABLED: Auto-connect nếu user đã connect trước đó
    // Logic: Chỉ auto-connect nếu:
    // 1. MetaMask có accounts (đã grant permission)
    // 2. User CHƯA click logout (flag !== 'true')
    await checkWalletConnection();

    // Connect wallet button handler
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            await connectWallet();
        });
    }

    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
});

// Check if wallet is already connected
async function checkWalletConnection() {
    if (typeof window.ethereum === 'undefined') {
        console.log('MetaMask is not installed');
        return;
    }

    // Check if user manually disconnected
    const isManuallyDisconnected = localStorage.getItem('walletDisconnected');
    if (isManuallyDisconnected === 'true') {
        console.log('User manually disconnected, skip auto-connect');
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            console.log('Wallet already connected:', accounts[0]);
            currentAccount = accounts[0];
            
            // Initialize provider first
            await initializeProvider();
            
            // Then update UI
            await updateWalletUI(currentAccount);
        }
    } catch (error) {
        console.error('Error checking wallet connection:', error);
    }
}

// Connect wallet function
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        showAlert('Vui lòng cài đặt MetaMask để kết nối ví!', 'warning');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }

    try {
        console.log('Starting wallet connection...');
        
        // Clear disconnected flag when user actively connects
        localStorage.removeItem('walletDisconnected');
        
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('Accounts received:', accounts);
        currentAccount = accounts[0];
        
        // Initialize provider FIRST
        await initializeProvider();
        console.log('Provider initialized');
        
        // Check and switch to Conflux eSpace Testnet
        await switchToConfluxNetwork();
        console.log('Network switched');
        
        // Update UI AFTER provider is ready
        await updateWalletUI(currentAccount);
        console.log('UI updated');
        
        showAlert('Kết nối ví thành công!', 'success');
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        if (error.code === 4001) {
            showAlert('Bạn đã từ chối kết nối ví', 'warning');
        } else {
            showAlert('Lỗi khi kết nối ví: ' + error.message, 'danger');
        }
    }
}

// Initialize ethers provider
async function initializeProvider() {
    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        // Get network info
        const network = await provider.getNetwork();
        console.log('Connected to network:', network);
        
        return { provider, signer };
    } catch (error) {
        console.error('Error initializing provider:', error);
        throw error;
    }
}

// Switch to Conflux eSpace Testnet
async function switchToConfluxNetwork() {
    const confluxTestnetParams = {
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

    try {
        // Try to switch to the network
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: confluxTestnetParams.chainId }],
        });
        console.log('Switched to Conflux eSpace Testnet');
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [confluxTestnetParams],
                });
                console.log('Added Conflux eSpace Testnet to MetaMask');
            } catch (addError) {
                console.error('Error adding Conflux network:', addError);
                throw addError;
            }
        } else {
            console.error('Error switching network:', switchError);
            throw switchError;
        }
    }
}

// Update wallet UI
async function updateWalletUI(account) {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletDisplay = document.getElementById('walletDisplay');
    const walletAddress = document.getElementById('walletAddress');
    const walletBalance = document.getElementById('walletBalance');

    if (account) {
        // Show wallet display
        const shortAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
        walletAddress.textContent = shortAddress;
        walletAddress.title = account; // Show full address on hover
        
        // Update button state
        if (connectWalletBtn) {
            connectWalletBtn.style.display = 'none';
        }
        
        if (walletDisplay) {
            walletDisplay.style.display = 'block';
        }

        // Get and display balance - Make sure provider is initialized
        try {
            // Re-initialize provider if needed
            if (!provider) {
                provider = new ethers.providers.Web3Provider(window.ethereum);
            }
            
            console.log('Getting balance for account:', account);
            const balance = await provider.getBalance(account);
            console.log('Balance (Wei):', balance.toString());
            
            const balanceInCFX = ethers.utils.formatEther(balance);
            console.log('Balance (CFX):', balanceInCFX);
            
            if (walletBalance) {
                walletBalance.textContent = `${parseFloat(balanceInCFX).toFixed(4)} CFX`;
                console.log('Balance displayed:', walletBalance.textContent);
            }
        } catch (error) {
            console.error('Error getting balance:', error);
            if (walletBalance) {
                walletBalance.textContent = '0.0000 CFX';
            }
        }

        // Add click to copy address
        if (walletAddress) {
            walletAddress.style.cursor = 'pointer';
            walletAddress.onclick = () => {
                navigator.clipboard.writeText(account);
                showAlert('Đã copy địa chỉ ví!', 'success');
            };
        }
    } else {
        // Hide wallet display
        if (walletDisplay) {
            walletDisplay.style.display = 'none';
        }
        
        if (connectWalletBtn) {
            connectWalletBtn.style.display = 'inline-block';
            connectWalletBtn.innerHTML = '<i class="fas fa-wallet me-2"></i>Kết nối ví';
            connectWalletBtn.classList.remove('connected');
        }
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected wallet
        console.log('Please connect to MetaMask.');
        currentAccount = null;
        updateWalletUI(null);
        showAlert('Ví đã ngắt kết nối', 'info');
    } else if (accounts[0] !== currentAccount) {
        // User switched accounts
        currentAccount = accounts[0];
        updateWalletUI(currentAccount);
        showAlert('Đã chuyển tài khoản', 'info');
        
        // Reload page to refresh data
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
}

// Handle chain changes
function handleChainChanged(chainId) {
    console.log('Chain changed to:', chainId);
    // Reload page to reset provider
    window.location.reload();
}

// Disconnect wallet function
function disconnectWallet() {
    // Try to revoke MetaMask permission (best practice)
    if (typeof window.ethereum !== 'undefined') {
        try {
            window.ethereum.request({
                method: 'wallet_revokePermissions',
                params: [{ eth_accounts: {} }]
            }).then(() => {
                console.log('✅ MetaMask permission revoked');
            }).catch(error => {
                console.log('⚠️ Cannot revoke permission (API may not be supported):', error.message);
            });
        } catch (error) {
            console.log('⚠️ Revoke permission not supported:', error.message);
        }
    }
    
    // Set flag to prevent auto-reconnect (fallback)
    localStorage.setItem('walletDisconnected', 'true');
    
    currentAccount = null;
    provider = null;
    signer = null;
    updateWalletUI(null);
    
    // Reload page immediately without showing alert
    // (Alert would appear twice: once here, once after reload)
    window.location.reload();
}

// Show alert function
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Export functions for use in other scripts
window.walletConnection = {
    getCurrentAccount: () => currentAccount,
    getProvider: () => provider,
    getSigner: () => signer,
    connectWallet: connectWallet,
    disconnectWallet: disconnectWallet,
    isConnected: () => currentAccount !== null,
    
    // ✅ NEW: Check if wallet is connected, if not, prompt user to connect
    requireWalletConnection: async function() {
        if (currentAccount) {
            return true; // Already connected
        }
        
        // Not connected, show alert and prompt to connect
        showAlert('⚠️ Vui lòng kết nối ví để tiếp tục', 'warning');
        
        // Optionally, try to connect automatically
        try {
            await connectWallet();
            return currentAccount !== null;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            return false;
        }
    }
};

console.log('Wallet connection module loaded');
