        // Web3 và Contract Setup
        let provider = null;
        let signer = null;
        let charityContract = null;
        let currentAccount = null;
        
        // Contract Address (deployed on chain-71)
        const CHARITY_CONTRACT_ADDRESS = "0x7fF862bAD0628e1987037294C3c4bc3d6f367471";
        
        // Exchange rates
        let ethToVnd = 0;
        let lastFetchTime = 0;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        
        // Get ETH to VND exchange rate
        async function getEthToVnd() {
            const now = Date.now();
            // Use cached rate if still fresh
            if (ethToVnd > 0 && (now - lastFetchTime) < CACHE_DURATION) {
                return ethToVnd;
            }
            
            try {
                // Get ETH/USD rate from CoinGecko (free API, no key needed)
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                const data = await response.json();
                const ethToUsd = data.ethereum.usd;
                
                // USD to VND rate (approximately 25,000 VND per USD)
                const usdToVnd = 25000;
                
                ethToVnd = ethToUsd * usdToVnd;
                lastFetchTime = now;
                
                console.log(`ETH/VND rate updated: ${ethToVnd.toLocaleString('vi-VN')} VND`);
                return ethToVnd;
            } catch (error) {
                console.error('Error fetching exchange rate:', error);
                // Fallback rate if API fails (approximately)
                ethToVnd = 80000000; // ~80 million VND per ETH
                return ethToVnd;
            }
        }
        
        // Convert ETH to VND
        function ethToVndDisplay(ethAmount) {
            if (!ethToVnd) return '';
            const vnd = ethAmount * ethToVnd;
            return vnd.toLocaleString('vi-VN');
        }
        
        // Convert VND to ETH
        function vndToEth(vndAmount) {
            if (!ethToVnd || ethToVnd === 0) {
                // Fallback: 1 ETH ≈ 80,000,000 VND
                return vndAmount / 80000000;
            }
            return vndAmount / ethToVnd;
        }
        
        // Load ABI
        let CHARITY_ABI = null;
        
        // Load ABI from file
        async function loadABI() {
            try {
                const response = await fetch('charityAbi.json');
                const data = await response.json();
                CHARITY_ABI = data.abi;
                console.log('ABI loaded successfully');
            } catch (error) {
                console.error('Error loading ABI:', error);
            }
        }
        
        // Initialize Web3
        async function initWeb3() {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    await loadABI();
                    if (CHARITY_ABI) {
                        charityContract = new ethers.Contract(CHARITY_CONTRACT_ADDRESS, CHARITY_ABI, provider);
                        console.log('Contract initialized:', CHARITY_CONTRACT_ADDRESS);
                    }
                } catch (error) {
                    console.error('Error initializing Web3:', error);
                }
            }
        }
        
        // Dữ liệu campaigns - sẽ được load từ blockchain
        let campaigns = [];
        
        // Dữ liệu transactions - sẽ được load từ blockchain
        let transactions = [];

        // Simple notification system
        function showNotification(message, type = 'success') {
            // Remove existing notification if any
            const existing = document.getElementById('topNotification');
            if (existing) {
                existing.remove();
            }
            
            // Create notification
            const notification = document.createElement('div');
            notification.id = 'topNotification';
            notification.style.cssText = `
                position: fixed;
                top: -100px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === 'success' ? '#10b981' : '#ef4444'};
                color: white;
                padding: 1rem 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                font-weight: 500;
                transition: top 0.3s ease;
                max-width: 90%;
                text-align: center;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Slide down
            setTimeout(() => {
                notification.style.top = '80px';
            }, 10);
            
            // Slide up and remove after 3 seconds
            setTimeout(() => {
                notification.style.top = '-100px';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Switch tabs
        function showTab(tabName) {
            document.querySelectorAll('.tab-content-area').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.getElementById('tab-' + tabName).classList.add('active');
            
            // Update active button
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => {
                if (btn.textContent.toLowerCase().includes(tabName === 'home' ? 'trang chủ' : 
                    tabName === 'create' ? 'tạo chiến dịch' :
                    tabName === 'disburse' ? 'giải ngân' : 'quản lý')) {
                    btn.classList.add('active');
                }
            });

            // Show/hide main navigation
            if (tabName === 'detail') {
                document.getElementById('mainNavigation').style.display = 'none';
            } else {
                document.getElementById('mainNavigation').style.display = 'block';
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Connect wallet
        document.getElementById('connectWalletBtn').addEventListener('click', async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    currentAccount = accounts[0];
                    
                    // Initialize provider and signer
                    provider = new ethers.providers.Web3Provider(window.ethereum);
                    signer = provider.getSigner();
                    
                    // Check if on correct network (Conflux eSpace Testnet - Chain ID: 71)
                    const network = await provider.getNetwork();
                    if (network.chainId !== 71) {
                        try {
                            // Try to switch to Conflux eSpace Testnet
                            await window.ethereum.request({
                                method: 'wallet_switchEthereumChain',
                                params: [{ chainId: '0x47' }], // 71 in hex
                            });
                        } catch (switchError) {
                            // This error code indicates that the chain has not been added to MetaMask
                            if (switchError.code === 4902) {
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
                            } else {
                                throw switchError;
                            }
                        }
                        // Reload provider after network change
                        provider = new ethers.providers.Web3Provider(window.ethereum);
                        signer = provider.getSigner();
                    }
                    
                    // Initialize contract with signer
                    if (CHARITY_ABI) {
                        charityContract = new ethers.Contract(CHARITY_CONTRACT_ADDRESS, CHARITY_ABI, signer);
                    }
                    
                    document.getElementById('adminWallet').textContent = `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`;
                    document.getElementById('connectWalletBtn').innerHTML = '<i class="fas fa-check"></i> Đã kết nối';
                    document.getElementById('connectWalletBtn').style.display = 'none';
                    document.getElementById('logoutBtn').style.display = 'block';
                    
                    showAlert('createAlert', 'success', 'Kết nối ví thành công!');
                    
                    // Load campaigns from blockchain
                    await loadCampaignsFromBlockchain();
                } catch (error) {
                    console.error('Connection error:', error);
                    showAlert('createAlert', 'danger', 'Lỗi: ' + error.message);
                }
            } else {
                showAlert('createAlert', 'warning', 'Vui lòng cài MetaMask!');
            }
        });

        // Logout wallet
        document.getElementById('logoutBtn').addEventListener('click', function() {
            // Reset variables
            currentAccount = null;
            provider = null;
            signer = null;
            charityContract = null;
            campaigns = [];
            transactions = [];
            
            // Update UI
            document.getElementById('adminWallet').textContent = '';
            document.getElementById('connectWalletBtn').innerHTML = '<i class="fas fa-wallet"></i> <span class="d-none d-md-inline ms-2">Kết nối ví</span>';
            document.getElementById('connectWalletBtn').style.display = 'block';
            document.getElementById('logoutBtn').style.display = 'none';
            
            // Clear forms and alerts
            document.getElementById('createAlert').innerHTML = '';
            document.getElementById('disburseAlert').innerHTML = '';
            
            // Update dashboard
            updateDashboard();
            
            // Show tab home
            showTab('home');
            
            showAlert('createAlert', 'info', 'Đã đăng xuất khỏi ví thành công!');
        });

        // Preview URL image
        document.getElementById('mediaUrl').addEventListener('input', function(e) {
            const url = e.target.value;
            if (url && url.startsWith('http')) {
                document.getElementById('mediaPreview').innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 200px; border-radius: 12px;" onerror="this.style.display='none'; this.parentElement.innerHTML='<small class=\'text-danger\'>Không thể tải ảnh. Vui lòng kiểm tra link.</small>'">`;
                document.getElementById('mediaPreview').style.display = 'block';
            } else {
                document.getElementById('mediaPreview').style.display = 'none';
            }
        });
        
        // Show ETH equivalent when entering VND amount (for admin reference)
        document.getElementById('targetAmount').addEventListener('input', function(e) {
            const vnd = parseFloat(e.target.value);
            let ethPreview = document.getElementById('ethPreview');
            
            if (!ethPreview) {
                ethPreview = document.createElement('small');
                ethPreview.id = 'ethPreview';
                ethPreview.className = 'text-muted d-block mt-1';
                e.target.parentElement.appendChild(ethPreview);
            }
            
            if (vnd > 0) {
                const eth = vndToEth(vnd);
                ethPreview.innerHTML = `<i class="fas fa-link"></i> Blockchain: ≈ ${eth.toFixed(6)} ETH`;
            } else {
                ethPreview.innerHTML = '';
            }
        });
        
        // Show ETH equivalent for disburse amount
        document.getElementById('disburseAmount').addEventListener('input', function(e) {
            const vnd = parseFloat(e.target.value);
            let ethPreview = document.getElementById('disburseEthPreview');
            
            if (!ethPreview) {
                ethPreview = document.createElement('small');
                ethPreview.id = 'disburseEthPreview';
                ethPreview.className = 'text-muted d-block mt-1';
                e.target.parentElement.appendChild(ethPreview);
            }
            
            if (vnd > 0) {
                const eth = vndToEth(vnd);
                ethPreview.innerHTML = `<i class="fas fa-link"></i> Blockchain: ≈ ${eth.toFixed(6)} ETH`;
            } else {
                ethPreview.innerHTML = '';
            }
        });
        
        // Campaign select change handler
        document.getElementById('disburseCampaignSelect')?.addEventListener('change', async function(e) {
            const campaignId = parseInt(e.target.value);
            const infoBox = document.getElementById('campaignInfoBox');
            const infoContent = document.getElementById('campaignInfoContent');
            
            if (!campaignId) {
                infoBox.classList.add('d-none');
                return;
            }
            
            const campaign = campaigns.find(c => c.id === campaignId);
            if (!campaign) {
                infoBox.classList.add('d-none');
                return;
            }
            
            // Get wallet balance
            const walletBalance = await getCampaignWalletBalance(campaign.contractAddress);
            const currentVnd = ethToVnd ? ethToVndDisplay(campaign.currentAmount) : (campaign.currentAmount * 80000000).toLocaleString('vi-VN');
            const balanceVnd = walletBalance ? (ethToVnd ? ethToVndDisplay(parseFloat(walletBalance)) : (parseFloat(walletBalance) * 80000000).toLocaleString('vi-VN')) : 'Không xác định';
            
            infoContent.innerHTML = `
                <div class="row g-2 small">
                    <div class="col-md-6">
                        <strong>Tên:</strong> ${campaign.title}
                    </div>
                    <div class="col-md-6">
                        <strong>Địa điểm:</strong> ${campaign.location || 'Không rõ'}
                    </div>
                    <div class="col-md-6">
                        <strong>Đã quyên góp:</strong> <span class="text-success">${currentVnd} VND</span>
                    </div>
                    <div class="col-md-6">
                        <strong>Số dư ví:</strong> <span class="text-primary">${balanceVnd} VND</span>
                    </div>
                    <div class="col-12">
                        <strong>Ví nhận:</strong> <code class="small">${campaign.contractAddress}</code>
                    </div>
                </div>
            `;
            
            infoBox.classList.remove('d-none');
        });

        // Check if campaign is expired
        function getCampaignStatus(campaign) {
            if (!campaign.endDate) {
                return campaign.status;
            }
            
            const now = new Date();
            const endDate = new Date(campaign.endDate);
            
            if (now > endDate) {
                return 'expired';
            }
            
            return campaign.status;
        }
        
        // Check if campaign can accept donations
        function canAcceptDonations(campaign) {
            const status = getCampaignStatus(campaign);
            return status === 'active' && campaign.onChain;
        }
        
        // Check if campaign can be disbursed
        function canDisburse(campaign) {
            const status = getCampaignStatus(campaign);
            return status === 'expired' && campaign.currentAmount > 0;
        }
        
        // Get campaign wallet balance from blockchain
        async function getCampaignWalletBalance(walletAddress) {
            try {
                if (!provider || !walletAddress || walletAddress === '0x0000000000000000000000000000000000000000') {
                    return null;
                }
                const balance = await provider.getBalance(walletAddress);
                return ethers.utils.formatEther(balance);
            } catch (error) {
                console.error('Error getting wallet balance:', error);
                return null;
            }
        }
        
        // Populate disburse campaign dropdown
        function populateDisburseCampaigns() {
            const select = document.getElementById('disburseCampaignSelect');
            if (!select) return;
            
            // Keep only the default option
            select.innerHTML = '<option value="">-- Chọn chiến dịch cần giải ngân --</option>';
            
            // Filter campaigns that can be disbursed
            const disbursableCampaigns = campaigns.filter(c => canDisburse(c));
            
            if (disbursableCampaigns.length === 0) {
                select.innerHTML += '<option value="" disabled>Không có chiến dịch nào có thể giải ngân</option>';
                return;
            }
            
            // Add campaigns to dropdown
            disbursableCampaigns.forEach(c => {
                const amountVnd = ethToVnd ? ethToVndDisplay(c.currentAmount) : (c.currentAmount * 80000000).toLocaleString('vi-VN');
                select.innerHTML += `<option value="${c.id}">[ID: ${c.id}] ${c.title} - ${amountVnd} VND</option>`;
            });
        }

        // Load campaigns from blockchain
        async function loadCampaignsFromBlockchain() {
            if (!charityContract) {
                console.log('Contract not initialized');
                return;
            }
            
            try {
                showAlert('createAlert', 'info', 'Đang tải dữ liệu từ blockchain...');
                
                const nextId = await charityContract.nextCampaignId();
                const loadedCampaigns = [];
                
                for (let i = 1; i < nextId.toNumber(); i++) {
                    try {
                        const campaign = await charityContract.campaigns(i);
                        
                        // Convert BigNumber to number
                        const targetAmount = parseFloat(ethers.utils.formatEther(campaign.targetAmount));
                        const collected = parseFloat(ethers.utils.formatEther(campaign.collected));
                        const totalDisbursed = parseFloat(ethers.utils.formatEther(campaign.totalDisbursed));
                        
                        const campaignData = {
                            id: campaign.id.toNumber(),
                            title: campaign.title,
                            description: campaign.description,
                            location: campaign.location,
                            mediaUrl: campaign.media,
                            beneficiary: campaign.beneficiary,
                            targetAmount: targetAmount,
                            currentAmount: collected,
                            totalDisbursed: totalDisbursed,
                            contractAddress: campaign.campaignWallet,
                            createdAt: new Date(campaign.createdAt.toNumber() * 1000).toISOString(),
                            endDate: campaign.endDate.toNumber() > 0 ? new Date(campaign.endDate.toNumber() * 1000).toISOString() : null,
                            updatedAt: new Date(campaign.updatedAt.toNumber() * 1000).toISOString(),
                            status: campaign.active ? 'active' : 'draft',
                            onChain: true,
                            creator: campaign.creator,
                            likesCount: 0
                        };
                        
                        // Get likes count
                        try {
                            const likes = await charityContract.likesCount(campaign.id);
                            campaignData.likesCount = likes.toNumber();
                        } catch (error) {
                            console.error(`Error loading likes for campaign ${i}:`, error);
                        }
                        
                        loadedCampaigns.push(campaignData);
                    } catch (error) {
                        console.error(`Error loading campaign ${i}:`, error);
                    }
                }
                
                campaigns = loadedCampaigns;
                updateDashboard();
                
                showAlert('createAlert', 'success', `Đã tải ${campaigns.length} chiến dịch từ blockchain!`);
            } catch (error) {
                console.error('Error loading campaigns:', error);
                showAlert('createAlert', 'danger', 'Lỗi khi tải dữ liệu: ' + error.message);
            }
        }

        // Add focus event listener to clear duplicate error
        document.getElementById('contractAddress').addEventListener('focus', function() {
            this.classList.remove('is-invalid');
            const errorDiv = this.parentElement.querySelector('.duplicate-error');
            if (errorDiv) {
                errorDiv.remove();
            }
        });

        // Create campaign - Save directly to blockchain
        document.getElementById('campaignForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentAccount) {
                showAlert('createAlert', 'warning', 'Vui lòng kết nối ví trước!');
                return;
            }
            
            if (!charityContract || !signer) {
                showAlert('createAlert', 'danger', 'Vui lòng kết nối ví trước!');
                return;
            }
            
            // Get form data
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const location = document.getElementById('location').value;
            const targetAmountVnd = parseFloat(document.getElementById('targetAmount').value);
            const targetAmount = vndToEth(targetAmountVnd); // Convert VND to ETH
            const contractAddress = document.getElementById('contractAddress').value;
            const mediaUrl = document.getElementById('mediaUrl').value || '';
            const beneficiary = document.getElementById('beneficiary').value;
            
            // Check if wallet address is already used by another campaign
            const duplicateWallet = campaigns.find(c => 
                c.contractAddress.toLowerCase() === contractAddress.toLowerCase()
            );
            
            if (duplicateWallet) {
                const contractInput = document.getElementById('contractAddress');
                contractInput.classList.add('is-invalid');
                
                // Remove existing feedback
                const existingFeedback = contractInput.parentElement.querySelector('.duplicate-error');
                if (existingFeedback) {
                    existingFeedback.remove();
                }
                
                // Add simple red text below input
                const errorDiv = document.createElement('div');
                errorDiv.className = 'duplicate-error';
                errorDiv.style.cssText = `
                    display: block;
                    width: 100%;
                    margin-top: 0.25rem;
                    font-size: 0.875rem;
                    color: #dc3545;
                `;
                errorDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i> 
                    Địa chỉ ví đã tồn tại - Chiến dịch "${duplicateWallet.title}" đang sử dụng
                `;
                contractInput.parentElement.appendChild(errorDiv);
                
                // Scroll to the field
                contractInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                return;
            }
            
            // Remove validation error if address is valid
            const contractInput = document.getElementById('contractAddress');
            contractInput.classList.remove('is-invalid');
            const existingFeedback = contractInput.parentElement.querySelector('.duplicate-error');
            if (existingFeedback) {
                existingFeedback.remove();
            }
            
            // Parse endDate
            const endDateStr = document.getElementById('endDate').value;
            let endDate = null;
            let endDateTimestamp = 0;
            if (endDateStr) {
                const parts = endDateStr.split('/');
                if (parts.length === 3) {
                    endDate = new Date(parts[2], parts[1] - 1, parts[0]);
                    endDate.setHours(23, 59, 59, 999);
                    endDateTimestamp = Math.floor(endDate.getTime() / 1000);
                }
            }
            
            if (!endDateTimestamp || endDateTimestamp <= Math.floor(Date.now() / 1000)) {
                showNotification('Ngày kết thúc phải là ngày trong tương lai', 'error');
                return;
            }
            
            // Disable submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi transaction...';
            
            // Clear previous alerts
            document.getElementById('createAlert').innerHTML = '';
            
            // Check if current account is admin
            try {
                const isAdmin = await charityContract.isAdmin(currentAccount);
                if (!isAdmin) {
                    document.getElementById('createAlert').innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-triangle"></i> <strong>Không có quyền Admin!</strong>
                            <div class="mt-2 small">
                                Địa chỉ <code>${currentAccount}</code> chưa được cấp quyền Admin.<br>
                                Vui lòng liên hệ Owner để được thêm vào danh sách Admin.
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `;
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Tạo chiến dịch';
                    return;
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
            
            try {
                
                // Convert ETH to Wei
                const targetAmountWei = ethers.utils.parseEther(targetAmount.toString());
                
                // Call createCampaign function with new parameters
                const tx = await charityContract.createCampaign(
                    title,
                    description,
                    mediaUrl,
                    location,
                    targetAmountWei,
                    contractAddress,
                    endDateTimestamp,
                    beneficiary,
                    {
                        gasLimit: 3000000
                    }
                );
                
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang chờ xác nhận...';
                
                // Wait for transaction confirmation
                const receipt = await tx.wait();
                
                // Get campaign ID from event
                const event = receipt.events?.find(e => e.event === 'CampaignCreated');
                const campaignId = event?.args?.id.toNumber();
                
                // Add to local campaigns array
                campaigns.push({
                    id: campaignId,
                    title: title,
                    description: description,
                    location: location,
                    targetAmount: targetAmount,
                    currentAmount: 0,
                    totalDisbursed: 0,
                    contractAddress: contractAddress,
                    mediaUrl: mediaUrl,
                    beneficiary: beneficiary,
                    endDate: endDate ? endDate.toISOString() : null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'active',
                    onChain: true,
                    txHash: receipt.transactionHash,
                    creator: currentAccount
                });
                
                updateDashboard();
                
                // Show simple notification
                showNotification('Tạo chiến dịch thành công!', 'success');
                
                // Clear any previous alerts
                document.getElementById('createAlert').innerHTML = '';
                
                // Reset form
                this.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Tạo chiến dịch';
                
                // Chuyển về trang quản lý chiến dịch
                showTab('manage');
                
                // Reload campaigns from blockchain
                setTimeout(() => loadCampaignsFromBlockchain(), 2000);
            } catch (error) {
                console.error('Blockchain error:', error);
                
                // Determine error message
                let errorMsg = 'Có lỗi xảy ra';
                if (error.message.includes('user rejected')) {
                    errorMsg = 'Bạn đã từ chối giao dịch';
                } else if (error.message.includes('insufficient funds')) {
                    errorMsg = 'Không đủ gas fee';
                }
                
                // Show simple notification
                showNotification(errorMsg, 'error');
                
                // Clear any previous alerts
                document.getElementById('createAlert').innerHTML = '';
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-rocket"></i> Tạo chiến dịch';
            }
        });

        // Disburse form - Real blockchain interaction
        document.getElementById('disburseForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!charityContract || !signer) {
                showAlert('disburseAlert', 'danger', 'Vui lòng kết nối ví trước!');
                return;
            }
            
            const campaignIdInput = document.getElementById('disburseCampaignSelect').value;
            const amountVnd = parseFloat(document.getElementById('disburseAmount').value);
            const amountInput = vndToEth(amountVnd); // Convert VND to ETH
            const recipientAddr = document.getElementById('recipientAddr').value;
            const proofImage = document.getElementById('proofImage').value;
            const note = document.getElementById('disburseNote').value;
            
            if (!campaignIdInput) {
                showAlert('disburseAlert', 'warning', 'Vui lòng chọn chiến dịch!');
                return;
            }
            
            // Validate proof image and note
            if (!proofImage || !proofImage.startsWith('http')) {
                showAlert('disburseAlert', 'warning', 'Vui lòng nhập link hình ảnh chứng minh hợp lệ!');
                document.getElementById('proofImage').focus();
                return;
            }
            
            if (!note || note.trim().length < 10) {
                showAlert('disburseAlert', 'warning', 'Vui lòng nhập ghi chú chi tiết (ít nhất 10 ký tự)!');
                document.getElementById('disburseNote').focus();
                return;
            }
            
            // Check if current account is admin
            try {
                const isAdmin = await charityContract.isAdmin(currentAccount);
                if (!isAdmin) {
                    document.getElementById('disburseAlert').innerHTML = `
                        <div class="alert alert-danger alert-dismissible fade show" role="alert">
                            <i class="fas fa-exclamation-triangle"></i> <strong>Không có quyền Admin!</strong>
                            <div class="mt-2 small">
                                Địa chỉ <code>${currentAccount}</code> chưa được cấp quyền Admin.<br>
                                Chỉ Admin mới có thể giải ngân.
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `;
                    return;
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
            }
            
            // Check if campaign exists and is expired
            const campaign = campaigns.find(c => c.id == campaignIdInput);
            if (campaign) {
                if (!canDisburse(campaign)) {
                    showAlert('disburseAlert', 'warning', 'Chỉ có thể giải ngân khi chiến dịch đã kết thúc!');
                    return;
                }
            }
            
            // Validate inputs
            if (!campaignIdInput || !amountInput || !recipientAddr) {
                showAlert('disburseAlert', 'warning', 'Vui lòng điền đầy đủ thông tin!');
                return;
            }
            
            // Check if address is valid
            if (!ethers.utils.isAddress(recipientAddr)) {
                showAlert('disburseAlert', 'danger', 'Địa chỉ người nhận không hợp lệ!');
                return;
            }
            
            // Clear previous alerts
            document.getElementById('disburseAlert').innerHTML = '';
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';
            
            try {
                showAlert('disburseAlert', 'info', 'Đang gửi transaction giải ngân...');
                
                // Convert amount to Wei
                const amountWei = ethers.utils.parseEther(amountInput.toString());
                
                // Call disburseFromContract function with proof image and note
                const tx = await charityContract.disburseFromContract(
                    parseInt(campaignIdInput),
                    recipientAddr,
                    amountWei,
                    proofImage,
                    note
                );
                
                showAlert('disburseAlert', 'info', 'Đang chờ xác nhận transaction...');
                
                // Wait for confirmation
                const receipt = await tx.wait();
                
                // Create transaction record
                const txRecord = {
                    id: Date.now(),
                    campaignAddr: campaignIdInput,
                    amount: amountInput,
                    recipient: recipientAddr,
                    proofImage: proofImage,
                    note: note,
                    timestamp: new Date().toISOString(),
                    txHash: receipt.transactionHash,
                    blockNumber: receipt.blockNumber
                };
                
                transactions.push(txRecord);
                updateDashboard();
                
                showAlert('disburseAlert', 'success', `
                    <strong>Giải ngân thành công!</strong><br>
                    Số tiền: ${amountInput} ETH<br>
                    TxHash: <code>${receipt.transactionHash}</code><br>
                    Block: ${receipt.blockNumber}
                `);
                
                this.reset();
                document.getElementById('proofImagePreview').style.display = 'none';
                
                // Reload campaigns to update collected amount
                setTimeout(() => loadCampaignsFromBlockchain(), 2000);
            } catch (error) {
                console.error('Disburse error:', error);
                showAlert('disburseAlert', 'danger', `
                    <strong>Lỗi khi giải ngân!</strong><br>
                    ${error.message}
                `);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Giải ngân';
            }
        });

        // Update dashboard
        function updateDashboard() {
            document.getElementById('totalCampaigns').textContent = campaigns.length;
            
            // Populate disburse dropdown
            populateDisburseCampaigns();
            
            const total = campaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount), 0);
            const totalVnd = ethToVnd ? ethToVndDisplay(total) : (total * 80000000).toLocaleString('vi-VN');
            document.getElementById('totalAmount').innerHTML = `${totalVnd} <small class="text-muted" style="font-size: 0.7rem;">VND</small>`;
            
            document.getElementById('totalTx').textContent = transactions.length;
            
            updateRecentCampaigns();
            updateRecentTx();
            updateCampaignsList();
        }

        function updateRecentCampaigns() {
            const container = document.getElementById('recentCampaigns');
            if (campaigns.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Chưa có chiến dịch</p></div>';
                return;
            }
            
            container.innerHTML = campaigns.slice(-3).reverse().map(c => {
                const status = getCampaignStatus(c);
                const statusClass = status === 'active' ? 'status-active' : status === 'expired' ? 'bg-secondary' : 'status-draft';
                const statusText = status === 'active' ? 'Hoạt động' : status === 'expired' ? 'Đã kết thúc' : 'Nháp';
                const progress = (c.currentAmount / c.targetAmount * 100).toFixed(1);
                const progressColor = progress >= 100 ? '#10b981' : progress >= 50 ? '#06b6d4' : '#f59e0b';
                
                return `
                <div class="card mb-3 shadow-sm hover-lift" style="border: none; border-radius: 16px; overflow: hidden; transition: all 0.3s ease; cursor: pointer;" onclick="viewDetail(${c.id})">
                    <div class="card-body p-3">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="mb-0 fw-bold" style="color: #1e293b; line-height: 1.4;">${c.title}</h6>
                            <span class="badge ${statusClass} ms-2 flex-shrink-0">${statusText}</span>
                        </div>
                        
                        <p class="text-muted small mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">
                            ${c.description}
                        </p>
                        
                        <div class="mb-2">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted fw-semibold">Tiến độ quyên góp</small>
                                <small class="fw-bold" style="color: ${progressColor};">${progress}%</small>
                            </div>
                            <div class="progress" style="height: 8px; border-radius: 10px; background: #e2e8f0;">
                                <div class="progress-bar" style="width: ${progress}%; background: ${progressColor}; border-radius: 10px; transition: width 0.6s ease;"></div>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-baseline gap-2 flex-wrap">
                                    <div>
                                        <span class="fw-bold text-success">${ethToVnd ? ethToVndDisplay(c.currentAmount) : (c.currentAmount * 80000000).toLocaleString('vi-VN')}</span>
                                        <span class="text-muted small"> / ${ethToVnd ? ethToVndDisplay(c.targetAmount) : (c.targetAmount * 80000000).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <span class="badge bg-light text-dark border">VND</span>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary" style="border-radius: 8px; padding: 6px 16px;" onclick="event.stopPropagation(); viewDetail(${c.id})">
                                <i class="fas fa-eye"></i> Xem chi tiết
                            </button>
                        </div>
                        
                        ${c.location || c.endDate ? `
                        <div class="d-flex gap-3 mt-2 pt-2 border-top">
                            ${c.location ? `
                                <small class="text-muted">
                                    <i class="fas fa-map-marker-alt text-danger"></i> ${c.location}
                                </small>
                            ` : ''}
                            ${c.endDate ? `
                                <small class="text-muted">
                                    <i class="fas fa-clock text-primary"></i> ${new Date(c.endDate).toLocaleDateString('vi-VN')}
                                </small>
                            ` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('');
            
            // Add hover effect style
            const style = document.createElement('style');
            style.textContent = `
                .hover-lift:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important;
                }
            `;
            if (!document.getElementById('hover-lift-style')) {
                style.id = 'hover-lift-style';
                document.head.appendChild(style);
            }
        }

        function updateRecentTx() {
            const container = document.getElementById('recentTx');
            if (transactions.length === 0) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p class="small">Chưa có giao dịch</p></div>';
                return;
            }
            
            container.innerHTML = transactions.slice(-5).reverse().map(tx => `
                <div class="border-bottom pb-2 mb-2">
                    <div class="d-flex justify-content-between">
                        <strong class="text-success">${ethToVnd ? ethToVndDisplay(tx.amount) : (tx.amount * 80000000).toLocaleString('vi-VN')} VND</strong>
                        <small class="text-muted">${new Date(tx.timestamp).toLocaleDateString()}</small>
                    </div>
                    <small class="text-muted">${tx.recipient.slice(0, 10)}...</small>
                </div>
            `).join('');
            
            document.getElementById('txHistory').innerHTML = transactions.map(tx => `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <h6>${ethToVnd ? ethToVndDisplay(tx.amount) : (tx.amount * 80000000).toLocaleString('vi-VN')} VND</h6>
                            <span class="badge bg-success">Thành công</span>
                        </div>
                        <p class="mb-2"><small>Người nhận: <code>${tx.recipient}</code></small></p>
                        <p class="mb-2"><small>TxHash: <code>${tx.txHash}</code></small></p>
                        ${tx.proofImage ? `
                        <div class="mb-2">
                            <small class="d-block mb-1"><strong>Hình ảnh chứng minh:</strong></small>
                            <img src="${tx.proofImage}" style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer;" 
                                onclick="window.open('${tx.proofImage}', '_blank')" 
                                title="Click để xem ảnh kích thước đầy đủ">
                        </div>
                        ` : ''}
                        ${tx.note ? `<p class="mb-0"><small><strong>Ghi chú:</strong> ${tx.note}</small></p>` : ''}
                    </div>
                </div>
            `).reverse().join('');
        }

        function updateCampaignsList() {
            const container = document.getElementById('campaignsList');
            const filter = document.getElementById('filterStatus')?.value || 'all';
            
            // Filter based on actual status (active or expired)
            let filtered = campaigns;
            if (filter === 'active') {
                filtered = campaigns.filter(c => getCampaignStatus(c) === 'active');
            } else if (filter === 'expired') {
                filtered = campaigns.filter(c => getCampaignStatus(c) === 'expired');
            }
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Không tìm thấy chiến dịch nào</p>
                        ${campaigns.length === 0 ? `
                            <button class="btn btn-primary mt-3" onclick="showTab('create')">
                                <i class="fas fa-plus"></i> Tạo chiến dịch đầu tiên
                            </button>
                        ` : ''}
                    </div>
                `;
                return;
            }
            
            // Sắp xếp mới nhất lên đầu
            const sortedCampaigns = [...filtered].sort((a, b) => b.id - a.id);
            
            container.innerHTML = `
                <div class="row g-4">
                    ${sortedCampaigns.map(c => {
                        const status = getCampaignStatus(c);
                        const statusClass = status === 'active' ? 'status-active' : status === 'expired' ? 'bg-secondary' : 'status-draft';
                        const statusText = status === 'active' ? 'Hoạt động' : status === 'expired' ? 'Đã kết thúc' : 'Nháp';
                        const canDonate = canAcceptDonations(c);
                        const canDisburseNow = canDisburse(c);
                        return `
                        <div class="col-md-6 col-lg-4">
                            <div class="campaign-card" onclick="viewDetail(${c.id})">
                                <div class="campaign-img-wrapper">
                                    ${c.mediaUrl ? `
                                        <img src="${c.mediaUrl}" class="campaign-img">
                                    ` : `
                                        <div class="campaign-img d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);">
                                            <i class="fas fa-heart fa-3x text-white opacity-50"></i>
                                        </div>
                                    `}
                                    <div class="likes-badge">
                                        <i class="fas fa-heart"></i>
                                        <span>${c.likesCount || 0}</span>
                                    </div>
                                </div>
                                <div class="campaign-card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="mb-0 flex-grow-1 me-2">${c.title}</h6>
                                        <span class="badge ${statusClass} flex-shrink-0">
                                            ${statusText}
                                        </span>
                                    </div>
                                    <p class="text-muted small mb-3 campaign-description">
                                        ${c.description}
                                    </p>
                                    <div class="campaign-info">
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-between mb-1">
                                                <small class="text-muted">Tiến độ</small>
                                                <small class="text-muted">${(c.currentAmount / c.targetAmount * 100).toFixed(1)}%</small>
                                            </div>
                                            <div class="progress">
                                                <div class="progress-bar" style="width: ${(c.currentAmount / c.targetAmount * 100).toFixed(1)}%"></div>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between mb-2">
                                            <div>
                                                <small class="text-muted d-block">Đã quyên góp</small>
                                                <div class="d-flex align-items-baseline gap-1">
                                                    <strong class="text-success" style="font-size: 0.95rem;">${ethToVnd ? ethToVndDisplay(c.currentAmount) : (c.currentAmount * 80000000).toLocaleString('vi-VN')}</strong>
                                                    <small class="text-muted">VND</small>
                                                </div>
                                            </div>
                                            <div class="text-end">
                                                <small class="text-muted d-block">Mục tiêu</small>
                                                <div class="d-flex align-items-baseline gap-1 justify-content-end">
                                                    <strong style="font-size: 0.95rem;">${ethToVnd ? ethToVndDisplay(c.targetAmount) : (c.targetAmount * 80000000).toLocaleString('vi-VN')}</strong>
                                                    <small class="text-muted">VND</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            ${c.location ? `
                                                <div>
                                                    <small class="text-muted"><i class="fas fa-map-marker-alt"></i> ${c.location}</small>
                                                </div>
                                            ` : '<div></div>'}
                                            ${c.endDate ? `
                                                <div class="text-end">
                                                    <small class="text-muted"><i class="fas fa-clock"></i> ${new Date(c.endDate).toLocaleDateString('vi-VN')}</small>
                                                </div>
                                            ` : ''}
                                        </div>
                                        ${!canDonate && status === 'expired' ? `
                                            <div class="alert alert-warning mt-2 mb-0 py-2 small">
                                                <i class="fas fa-info-circle"></i> Chiến dịch đã kết thúc
                                            </div>
                                        ` : ''}
                                        ${canDisburseNow ? `
                                            <button class="btn btn-success btn-sm w-100 mt-2" onclick="event.stopPropagation(); showTab('disburse'); setTimeout(() => { document.getElementById('disburseCampaignSelect').value='${c.id}'; document.getElementById('disburseCampaignSelect').dispatchEvent(new Event('change')); }, 100);">
                                                <i class="fas fa-hand-holding-usd"></i> Có thể giải ngân
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        async function viewDetail(campaignId) {
            const campaign = campaigns.find(c => c.id === campaignId);
            if (!campaign) return;
            
            const progress = (campaign.currentAmount / campaign.targetAmount * 100).toFixed(1);
            const status = getCampaignStatus(campaign);
            const canDonate = canAcceptDonations(campaign);
            const canDisburseNow = canDisburse(campaign);
            const statusClass = status === 'active' ? 'status-active' : status === 'expired' ? 'bg-secondary' : 'status-draft';
            const statusText = status === 'active' ? 'Đang hoạt động' : status === 'expired' ? 'Đã kết thúc' : 'Bản nháp';
            
            // Get wallet balance if campaign is expired
            let walletBalance = null;
            if (status === 'expired' && campaign.contractAddress) {
                walletBalance = await getCampaignWalletBalance(campaign.contractAddress);
            }
            
            // Load donations and comments from blockchain (with parallel loading)
            let donationsList = [];
            let commentsList = [];
            let supportersCount = 0;
            
            if (charityContract && campaign.onChain) {
                try {
                    // Load counts in parallel
                    const [donationsCount, commentsCount, supporters] = await Promise.all([
                        charityContract.getDonationsCount(campaignId),
                        charityContract.getCommentsCount(campaignId),
                        charityContract.getSupportersCount(campaignId)
                    ]);
                    
                    supportersCount = supporters.toNumber();
                    const totalDonations = donationsCount.toNumber();
                    const totalComments = commentsCount.toNumber();
                    
                    // Limit to recent 20 items for better performance
                    const maxItems = 20;
                    
                    // Load donations in parallel
                    if (totalDonations > 0) {
                        const donationsToLoad = Math.min(totalDonations, maxItems);
                        const donationPromises = [];
                        for (let i = 0; i < donationsToLoad; i++) {
                            donationPromises.push(charityContract.getDonation(campaignId, i));
                        }
                        const donations = await Promise.all(donationPromises);
                        donationsList = donations.map(donation => ({
                            donor: donation.donor,
                            amount: parseFloat(ethers.utils.formatEther(donation.amount)),
                            timestamp: new Date(donation.timestamp.toNumber() * 1000),
                            blockNumber: donation.blockNumber.toNumber(),
                            txHash: donation.txHash
                        }));
                    }
                    
                    // Load comments in parallel
                    if (totalComments > 0) {
                        const commentsToLoad = Math.min(totalComments, maxItems);
                        const commentPromises = [];
                        for (let i = 0; i < commentsToLoad; i++) {
                            commentPromises.push(charityContract.getComment(campaignId, i));
                        }
                        const comments = await Promise.all(commentPromises);
                        commentsList = comments.map(comment => ({
                            commenter: comment.commenter,
                            text: comment.text,
                            timestamp: new Date(comment.timestamp.toNumber() * 1000),
                            isAnonymous: comment.isAnonymous
                        }));
                    }
                } catch (error) {
                    console.error('Error loading donations/comments:', error);
                }
            }
            
            document.getElementById('tab-detail').innerHTML = `
                <div class="detail-header">
                    <div class="container">
                        <div class="row align-items-center px-3">
                            <div class="col-auto">
                                <button class="back-btn" onclick="showTab('manage')">
                                    <i class="fas fa-arrow-left"></i> Quay lại
                                </button>
                            </div>
                            <div class="col text-center">
                                <h1 class="detail-title mb-2">${campaign.title}</h1>
                                <div class="detail-meta justify-content-center">
                                    <span class="detail-meta-item">
                                        <i class="fas fa-hashtag"></i> ID: ${campaign.id}
                                    </span>
                                    ${campaign.beneficiary ? `
                                    <span class="detail-meta-item">
                                        <i class="fas fa-user-check"></i> ${campaign.beneficiary}
                                    </span>
                                    ` : ''}
                                    ${campaign.creator ? `
                                    <span class="detail-meta-item">
                                        <i class="fas fa-user-shield"></i> ${campaign.creator.slice(0, 6)}...${campaign.creator.slice(-4)}
                                    </span>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="col-auto">
                                <span class="detail-badge">
                                    <i class="fas ${status === 'active' ? 'fa-check-circle' : 'fa-calendar-times'}"></i>
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="container mt-4">
                    <div class="row g-4">
                        <!-- Left Column -->
                        <div class="col-lg-8">
                            ${campaign.mediaUrl ? `
                                <img src="${campaign.mediaUrl}" class="detail-image mb-4" style="border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            ` : `
                                <div class="detail-image mb-4 d-flex align-items-center justify-content-center" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                                    <i class="fas fa-heart fa-5x text-white opacity-50"></i>
                                </div>
                            `}

                            <!-- Campaign Quick Stats -->
                            <div class="row g-3 mb-4">
                                <div class="col-md-3 col-6">
                                    <div class="card text-center h-100" style="border-left: 4px solid #06b6d4;">
                                        <div class="card-body p-3">
                                            <i class="fas fa-calendar-alt fa-2x text-primary mb-2"></i>
                                            <div class="small text-muted">Ngày tạo</div>
                                            <strong class="small">${new Date(campaign.createdAt).toLocaleDateString('vi-VN')}</strong>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3 col-6">
                                    <div class="card text-center h-100" style="border-left: 4px solid ${status === 'expired' ? '#ef4444' : '#10b981'};">
                                        <div class="card-body p-3">
                                            <i class="fas fa-clock fa-2x ${status === 'expired' ? 'text-danger' : 'text-success'} mb-2"></i>
                                            <div class="small text-muted">Kết thúc</div>
                                            <strong class="small ${status === 'expired' ? 'text-danger' : ''}">${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('vi-VN') : 'Không có'}</strong>
                                        </div>
                                    </div>
                                </div>
                                ${campaign.location ? `
                                <div class="col-md-3 col-6">
                                    <div class="card text-center h-100" style="border-left: 4px solid #8b5cf6;">
                                        <div class="card-body p-3">
                                            <i class="fas fa-map-marker-alt fa-2x text-purple mb-2"></i>
                                            <div class="small text-muted">Địa điểm</div>
                                            <strong class="small">${campaign.location}</strong>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                                <div class="col-md-3 col-6">
                                    <div class="card text-center h-100" style="border-left: 4px solid #f59e0b;">
                                        <div class="card-body p-3">
                                            <i class="fas fa-percentage fa-2x text-warning mb-2"></i>
                                            <div class="small text-muted">Tiến độ</div>
                                            <strong class="small">${progress}%</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card mb-4">
                                <div class="card-body">
                                    <h5 class="mb-3"><i class="fas fa-align-left text-primary"></i> Mô tả chi tiết</h5>
                                    <p class="text-muted mb-0" style="line-height: 1.8; white-space: pre-line;">${campaign.description}</p>
                                </div>
                            </div>

                            ${campaign.onChain ? `
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="mb-3"><i class="fas fa-link text-success"></i> Thông tin Blockchain</h5>
                                        <div class="mb-3">
                                            <label class="text-muted small mb-2 d-block"><i class="fas fa-file-contract"></i> Contract Address</label>
                                            <div class="d-flex align-items-center gap-2">
                                                <code class="d-block p-3 bg-light rounded flex-grow-1 small">${campaign.contractAddress}</code>
                                                <button class="btn btn-sm btn-outline-primary" onclick="navigator.clipboard.writeText('${campaign.contractAddress}'); showNotification('Đã copy địa chỉ!', 'success');">
                                                    <i class="fas fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                        ${campaign.txHash ? `
                                        <div class="mb-3">
                                            <label class="text-muted small mb-2 d-block"><i class="fas fa-receipt"></i> Transaction Hash</label>
                                            <div class="d-flex align-items-center gap-2">
                                                <code class="d-block p-3 bg-light rounded flex-grow-1 small">${campaign.txHash}</code>
                                                <button class="btn btn-sm btn-outline-primary" onclick="navigator.clipboard.writeText('${campaign.txHash}'); showNotification('Đã copy TxHash!', 'success');">
                                                    <i class="fas fa-copy"></i>
                                                </button>
                                            </div>
                                        </div>
                                        ` : ''}
                                        <a href="https://evmtestnet.confluxrpc.com/address/${campaign.contractAddress}" target="_blank" class="btn btn-success">
                                            <i class="fas fa-external-link-alt"></i> Xem trên Block Explorer
                                        </a>
                                    </div>
                                </div>
                            ` : `
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    <strong>Chưa được lưu trên Blockchain</strong>
                                    <p class="mb-0 mt-2 small">Chiến dịch này đang ở trạng thái bản nháp và chưa được kích hoạt trên blockchain.</p>
                                </div>
                            `}
                        </div>

                        <!-- Right Column -->
                        <div class="col-lg-4">
                            <div class="card sticky-top" style="top: 90px; z-index: 10;">
                                <div class="card-body">
                                    <h5 class="mb-4"><i class="fas fa-chart-line text-primary"></i> Tiến độ quyên góp</h5>
                                    
                                    <div class="text-center mb-4">
                                        <div class="display-4 fw-bold mb-2" style="color: ${progress >= 100 ? '#10b981' : '#06b6d4'};">${progress}%</div>
                                        <div class="progress mb-2" style="height: 14px; border-radius: 10px;">
                                            <div class="progress-bar ${progress >= 100 ? 'bg-success' : ''}" style="width: ${progress}%; transition: width 0.6s ease;"></div>
                                        </div>
                                        <small class="text-muted">${progress >= 100 ? '🎉 Đã đạt mục tiêu!' : 'Đang quyên góp'}</small>
                                    </div>

                                    <div class="row g-3 mb-4 pb-4 border-bottom">
                                        <div class="col-6">
                                            <div class="text-center p-2" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; color: white;">
                                                <small class="d-block mb-1 opacity-90" style="font-size: 0.75rem;">Đã quyên góp</small>
                                                <div class="fw-bold" style="font-size: 0.85rem; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;">${ethToVnd ? ethToVndDisplay(campaign.currentAmount) : (campaign.currentAmount * 80000000).toLocaleString('vi-VN')}</div>
                                                <small class="opacity-90 d-block" style="font-size: 0.7rem;">VND</small>
                                            </div>
                                        </div>
                                        <div class="col-6">
                                            <div class="text-center p-2" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 12px; color: white;">
                                                <small class="d-block mb-1 opacity-90" style="font-size: 0.75rem;">Mục tiêu</small>
                                                <div class="fw-bold" style="font-size: 0.85rem; line-height: 1.3; word-wrap: break-word; overflow-wrap: break-word; hyphens: auto;">${ethToVnd ? ethToVndDisplay(campaign.targetAmount) : (campaign.targetAmount * 80000000).toLocaleString('vi-VN')}</div>
                                                <small class="opacity-90 d-block" style="font-size: 0.7rem;">VND</small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-center mb-4">
                                        <div class="d-flex justify-content-around">
                                            <div>
                                                <h4 class="mb-0 text-primary">${donationsList.length}</h4>
                                                <small class="text-muted">Lượt quyên góp</small>
                                            </div>
                                            <div>
                                                <h4 class="mb-0 text-success">${supportersCount}</h4>
                                                <small class="text-muted">Nhà hào tâm</small>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${status === 'expired' && walletBalance !== null ? `
                                        <div class="alert alert-info mb-3">
                                            <div class="text-center">
                                                <i class="fas fa-wallet fa-2x mb-2"></i>
                                                <div><strong>Số dư ví hiện tại</strong></div>
                                                <h3 class="mb-1 text-info">${ethToVnd ? ethToVndDisplay(parseFloat(walletBalance)) : (parseFloat(walletBalance) * 80000000).toLocaleString('vi-VN')} VND</h3>
                                                <small class="text-muted">Có thể giải ngân</small>
                                            </div>
                                        </div>
                                    ` : ''}
                                    
                                    ${!canDonate && status === 'expired' ? `
                                        <div class="alert alert-warning mb-3">
                                            <i class="fas fa-info-circle"></i> <strong>Chiến dịch đã kết thúc</strong><br>
                                            <small>Không còn nhận donation. Admin có thể tiến hành giải ngân.</small>
                                        </div>
                                    ` : ''}
                                    
                                    ${canDisburseNow ? `
                                        <button class="btn btn-success w-100 mb-3" onclick="showTab('disburse'); setTimeout(() => { document.getElementById('disburseCampaignSelect').value='${campaign.id}'; document.getElementById('disburseCampaignSelect').dispatchEvent(new Event('change')); }, 100);">
                                            <i class="fas fa-hand-holding-usd"></i> Giải ngân ngay
                                        </button>
                                    ` : ''}
                                    
                                    ${status === 'active' ? `
                                        <div class="alert alert-success mb-0">
                                            <i class="fas fa-check-circle"></i> <strong>Đang nhận quyên góp</strong><br>
                                            <small>Chiến dịch đang hoạt động và có thể nhận donation từ người dùng.</small>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Donations & Comments Section -->
                    <div class="row g-4 mt-2">
                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h5 class="mb-0"><i class="fas fa-hand-holding-heart text-success"></i> Lịch sử quyên góp</h5>
                                </div>
                                <div class="card-body" style="max-height: 500px; overflow-y: auto;">
                                    ${donationsList.length > 0 ? donationsList.sort((a, b) => b.timestamp - a.timestamp).map(d => `
                                        <div class="border-bottom pb-3 mb-3">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <strong class="text-success">${ethToVnd ? ethToVndDisplay(d.amount) : (d.amount * 80000000).toLocaleString('vi-VN')} VND</strong>
                                                    <div class="small text-muted">
                                                        <i class="fas fa-user"></i> ${d.donor.slice(0, 6)}...${d.donor.slice(-4)}
                                                    </div>
                                                </div>
                                                <small class="text-muted">${d.timestamp.toLocaleString('vi-VN')}</small>
                                            </div>
                                            <div class="small">
                                                <span class="badge bg-light text-dark">
                                                    <i class="fas fa-cube"></i> Block: ${d.blockNumber}
                                                </span>
                                            </div>
                                        </div>
                                    `).join('') : `
                                        <div class="text-center text-muted py-4">
                                            <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                                            <p>Chưa có quyên góp nào</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-6">
                            <div class="card">
                                <div class="card-header bg-light">
                                    <h5 class="mb-0"><i class="fas fa-comments text-primary"></i> Bình luận (${commentsList.length})</h5>
                                </div>
                                <div class="card-body" style="max-height: 500px; overflow-y: auto;">
                                    ${commentsList.length > 0 ? commentsList.sort((a, b) => b.timestamp - a.timestamp).map(c => `
                                        <div class="border-bottom pb-3 mb-3">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <strong>${c.isAnonymous ? '<i class="fas fa-user-secret"></i> Ẩn danh' : `<i class="fas fa-user"></i> ${c.commenter.slice(0, 6)}...${c.commenter.slice(-4)}`}</strong>
                                                </div>
                                                <small class="text-muted">${c.timestamp.toLocaleString('vi-VN')}</small>
                                            </div>
                                            <p class="mb-0 text-muted">${c.text}</p>
                                        </div>
                                    `).join('') : `
                                        <div class="text-center text-muted py-4">
                                            <i class="fas fa-inbox fa-3x mb-3 opacity-50"></i>
                                            <p>Chưa có bình luận nào</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            showTab('detail');
        }

        function showAlert(elementId, type, message) {
            const alertDiv = document.getElementById(elementId);
            alertDiv.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;
            setTimeout(() => {
                const alert = alertDiv.querySelector('.alert');
                if (alert) alert.remove();
            }, 5000);
        }

        function resetForm() {
            document.getElementById('campaignForm').reset();
            document.getElementById('mediaPreview').style.display = 'none';
            document.getElementById('createAlert').innerHTML = '';
        }

        function resetDisburseForm() {
            document.getElementById('disburseForm').reset();
            document.getElementById('disburseAlert').innerHTML = '';
        }

        function filterCampaigns() {
            updateCampaignsList();
        }
        
        // Generate new wallet for campaign
        function generateNewWallet() {
            try {
                // Create random wallet
                const wallet = ethers.Wallet.createRandom();
                
                // Clear any duplicate error
                const contractInput = document.getElementById('contractAddress');
                contractInput.classList.remove('is-invalid');
                const errorDiv = contractInput.parentElement.querySelector('.duplicate-error');
                if (errorDiv) {
                    errorDiv.remove();
                }
                
                // Set the address value
                contractInput.value = wallet.address;
                
                // Show wallet info with warning
                document.getElementById('createAlert').innerHTML = `
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <h5 class="alert-heading"><i class="fas fa-check-circle"></i> Tạo ví thành công!</h5>
                        <hr>
                        <div class="mb-2">
                            <strong><i class="fas fa-wallet"></i> Địa chỉ ví:</strong>
                            <div class="mt-1">
                                <code class="d-block p-2 bg-light text-dark rounded">${wallet.address}</code>
                            </div>
                        </div>
                        <div class="mb-2">
                            <strong><i class="fas fa-key"></i> Private Key:</strong>
                            <div class="mt-1">
                                <code class="d-block p-2 bg-light text-dark rounded">${wallet.privateKey}</code>
                            </div>
                        </div>
                        <hr>
                        <div class="alert alert-danger mb-0 mt-2">
                            <i class="fas fa-exclamation-triangle"></i> <strong>Cảnh báo bảo mật:</strong>
                            <ul class="mb-0 mt-2 small">
                                <li>Hãy sao lưu Private Key này ngay! Bạn sẽ cần nó để truy cập ví.</li>
                                <li>Không chia sẻ Private Key với bất kỳ ai!</li>
                                <li>Mất Private Key = Mất quyền truy cập vĩnh viễn vào ví.</li>
                            </ul>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                `;
                
            } catch (error) {
                console.error('Error generating wallet:', error);
                showAlert('createAlert', 'danger', 'Lỗi khi tạo ví: ' + error.message);
            }
        }

        // Make functions global
        window.showTab = showTab;
        window.viewDetail = viewDetail;
        window.resetForm = resetForm;
        window.resetDisburseForm = resetDisburseForm;
        window.filterCampaigns = filterCampaigns;
        window.generateNewWallet = generateNewWallet;

        // Initialize dashboard on page load
        document.addEventListener('DOMContentLoaded', async function() {
            // Load ABI first
            await loadABI();
            
            // Initialize Web3
            await initWeb3();
            
            // Get exchange rate
            await getEthToVnd();
            
            // Update dashboard with existing data
            updateDashboard();
            
            // Auto-connect if wallet was previously connected
            if (window.ethereum && window.ethereum.selectedAddress) {
                document.getElementById('connectWalletBtn').click();
            }
            
            // Refresh exchange rate every 5 minutes
            setInterval(async () => {
                await getEthToVnd();
                updateDashboard();
            }, 5 * 60 * 1000);
        });