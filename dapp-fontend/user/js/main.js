// Main JavaScript for index.html
document.addEventListener('DOMContentLoaded', async function() {
    await loadFeaturedCampaigns();
    loadBlockchainStats();
    
    // Listen for wallet connection
    window.addEventListener('walletConnected', () => {
        loadFeaturedCampaigns();
    });
});

async function loadFeaturedCampaigns() {
    const container = document.getElementById('featuredCampaigns');
    if (!container) return;
    
    try {
        // Show loading
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
                <p class="text-muted mt-3">Đang tải chiến dịch...</p>
            </div>
        `;
        
        // Initialize contract if not already initialized
        if (!window.smartContract.contract) {
            if (window.walletConnection && window.walletConnection.isConnected) {
                const provider = window.walletConnection.getProvider();
                const signer = window.walletConnection.getSigner();
                await window.smartContract.initialize(provider, signer);
            } else {
                // Use public Conflux eSpace Testnet RPC for read-only access
                const provider = new ethers.providers.JsonRpcProvider('https://evmtestnet.confluxrpc.com');
                await window.smartContract.initialize(provider, provider);
            }
        }
        
        // Get campaigns from smart contract
        const campaigns = await window.smartContract.getAllCampaigns();
        
        if (campaigns.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Chưa có chiến dịch nào</p>
                </div>
            `;
            return;
        }
        
        // Filter active campaigns and sort by created date
        const activeCampaigns = campaigns
            .filter(c => c.active)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 6); // Get top 6
        
        // Clear container
        container.innerHTML = '';
        
        // Render campaigns
        for (const campaign of activeCampaigns) {
            const card = await createCampaignCard(campaign);
            container.appendChild(card);
        }
        
        // Update stats
        updateHomeStats(campaigns);
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-danger">Lỗi khi tải dữ liệu</p>
                <button class="btn btn-primary" onclick="loadFeaturedCampaigns()">Thử lại</button>
            </div>
        `;
    }
}

async function createCampaignCard(campaign) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    
    // Get additional data
    const likesCount = await window.smartContract.getLikesCount(campaign.id);
    
    // Determine badge status
    let badgeClass = 'badge-success';
    let badgeText = 'Hoạt động';
    
    if (campaign.daysLeft <= 0) {
        badgeClass = 'badge-danger';
        badgeText = 'Đã kết thúc';
    } else if (campaign.daysLeft < 7) {
        badgeClass = 'badge-warning';
        badgeText = 'Sắp kết thúc';
    } else if (campaign.progress >= 100) {
        badgeClass = 'badge-info';
        badgeText = 'Đã đạt mục tiêu';
    }
    
    // Get image
    const imageUrl = campaign.media || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=250&fit=crop';
    
    // Format amounts in VND
    const collectedDisplay = campaign.collectedVnd || '0';
    const targetDisplay = campaign.targetVnd || '0';
    
    col.innerHTML = `
        <div class="campaign-card">
            <div class="campaign-image">
                <img src="${imageUrl}" alt="${campaign.title}"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect fill=%22%23e9ecef%22 width=%22400%22 height=%22250%22/%3E%3Ctext fill=%22%236c757d%22 font-family=%22Arial%22 font-size=%2220%22 text-anchor=%22middle%22 x=%22200%22 y=%22135%22%3ECampaign Image%3C/text%3E%3C/svg%3E'">
                <span class="campaign-badge ${badgeClass}">${badgeText}</span>
                <button class="like-btn" data-campaign-id="${campaign.id}">
                    <i class="far fa-heart"></i>
                    <span class="like-count">${likesCount}</span>
                </button>
            </div>
            <div class="card-body">
                <h5 class="card-title">${campaign.title}</h5>
                <p class="card-text">${campaign.description}</p>
                
                <div class="campaign-progress">
                    <div class="progress-label">
                        <span>Tiến độ</span>
                        <span class="progress-percentage">${campaign.progress}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${campaign.progress}%" 
                             aria-valuenow="${campaign.progress}" 
                             aria-valuemin="0" 
                             aria-valuemax="100"></div>
                    </div>
                </div>
                
                <div class="campaign-stats">
                    <div class="stat-item">
                        <span class="stat-label">Đã quyên góp</span>
                        <span class="stat-value amount">${collectedDisplay} <small>VND</small></span>
                    </div>
                    <div class="stat-item text-end">
                        <span class="stat-label">Mục tiêu</span>
                        <span class="stat-value target">${targetDisplay} <small>VND</small></span>
                    </div>
                </div>
                
                <div class="campaign-info mt-auto">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${campaign.location || 'Việt Nam'}</span>
                        </div>
                        <div>
                            <i class="fas fa-clock"></i>
                            <span>${campaign.daysLeft > 0 ? campaign.daysLeft + ' ngày còn lại' : 'Đã kết thúc'}</span>
                        </div>
                    </div>
                    <a href="campaign-detail.html?id=${campaign.id}" 
                       class="btn btn-primary w-100 mt-3">
                        Xem chi tiết
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Add like button listener
    const likeBtn = col.querySelector('.like-btn');
    likeBtn.addEventListener('click', (e) => handleLike(e, campaign.id));
    
    // Check if already liked
    if (window.walletConnection && window.walletConnection.isConnected) {
        const isLiked = await window.smartContract.isLiked(campaign.id, window.walletConnection.account);
        if (isLiked) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('i').classList.remove('far');
            likeBtn.querySelector('i').classList.add('fas');
        }
    }
    
    return col;
}

async function handleLike(event, campaignId) {
    event.preventDefault();
    event.stopPropagation();
    
    const btn = event.currentTarget;
    
    if (!window.walletConnection || !window.walletConnection.isConnected) {
        showAlert('Vui lòng kết nối ví để thích chiến dịch', 'warning');
        return;
    }
    
    try {
        btn.disabled = true;
        const isLiked = btn.classList.contains('liked');
        
        if (isLiked) {
            const result = await window.smartContract.unlike(campaignId);
            if (result.success) {
                btn.classList.remove('liked');
                btn.querySelector('i').classList.remove('fas');
                btn.querySelector('i').classList.add('far');
                
                const countSpan = btn.querySelector('.like-count');
                const currentCount = parseInt(countSpan.textContent);
                countSpan.textContent = currentCount - 1;
                
                showAlert('Đã bỏ thích', 'success');
            }
        } else {
            const result = await window.smartContract.like(campaignId);
            if (result.success) {
                btn.classList.add('liked');
                btn.querySelector('i').classList.remove('far');
                btn.querySelector('i').classList.add('fas');
                
                const countSpan = btn.querySelector('.like-count');
                const currentCount = parseInt(countSpan.textContent);
                countSpan.textContent = currentCount + 1;
                
                showAlert('Đã thích chiến dịch', 'success');
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showAlert('Lỗi khi thực hiện: ' + error.message, 'danger');
    } finally {
        btn.disabled = false;
    }
}

async function updateHomeStats(campaigns) {
    // Total active campaigns
    const activeCampaigns = campaigns.filter(c => c.active);
    const totalCampaignsEl = document.getElementById('totalCampaigns');
    if (totalCampaignsEl) {
        totalCampaignsEl.textContent = activeCampaigns.length;
    }
    
    // Calculate total donations and supporters
    let totalDonations = 0;
    let totalSupporters = 0;
    
    for (const campaign of campaigns) {
        // Get total collected for each campaign
        totalDonations += parseFloat(campaign.collectedEth || 0);
        
        // Get supporters count for each campaign
        try {
            const supportersCount = await window.smartContract.getSupportersCount(campaign.id);
            totalSupporters += supportersCount;
        } catch (error) {
            console.error('Error getting supporters count:', error);
        }
    }
    
    // Update total donations display in VND
    const totalDonationsEl = document.getElementById('totalDonations');
    if (totalDonationsEl) {
        const totalVnd = window.smartContract.ethToVndDisplay(totalDonations);
        totalDonationsEl.textContent = formatVndShort(parseFloat(totalVnd.replace(/\./g, '').replace(/,/g, ''))) + ' VND';
    }
    
    // Update total supporters display
    const totalSupportersEl = document.getElementById('totalSupporters');
    if (totalSupportersEl) {
        totalSupportersEl.textContent = totalSupporters.toLocaleString('vi-VN');
    }
}

// Format large VND numbers to short format (1M, 20M, etc)
function formatVndShort(amount) {
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1).replace('.0', '') + 'B';
    } else if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(1).replace('.0', '') + 'K';
    }
    return amount.toLocaleString('vi-VN');
}

function loadBlockchainStats() {
    // Mock blockchain stats - replace with real data
    const stats = {
        blockHeight: Math.floor(Math.random() * 1000000) + 18000000,
        totalTx: Math.floor(Math.random() * 100000) + 1200000,
        gasPrice: Math.floor(Math.random() * 30) + 10
    };
    
    const blockHeightEl = document.getElementById('blockHeight');
    if (blockHeightEl) {
        blockHeightEl.textContent = stats.blockHeight.toLocaleString('vi-VN');
    }
    
    const totalTxEl = document.getElementById('totalTx');
    if (totalTxEl) {
        totalTxEl.textContent = stats.totalTx.toLocaleString('vi-VN');
    }
    
    const gasPriceEl = document.getElementById('gasPrice');
    if (gasPriceEl) {
        gasPriceEl.textContent = stats.gasPrice + ' Gwei';
    }
}

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function showAlert(message, type = 'info') {
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
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
