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
    col.className = 'col-lg-4 col-md-6 mb-4 fade-in-up';
    
    // Get additional data
    const supportersCount = await window.smartContract.getSupportersCount(campaign.id);
    const likesCount = await window.smartContract.getLikesCount(campaign.id);
    
    // Determine badge
    let badge = '';
    if (campaign.daysLeft < 7) {
        badge = '<span class="badge bg-danger">Sắp kết thúc</span>';
    } else if (campaign.progress >= 75) {
        badge = '<span class="badge bg-success">Gần đạt mục tiêu</span>';
    } else {
        badge = '<span class="badge bg-primary">Đang diễn ra</span>';
    }
    
    // Get image from media or use default
    const imageUrl = campaign.media || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=250&fit=crop';
    
    col.innerHTML = `
        <div class="campaign-card bg-white rounded-3 shadow-sm h-100 hover-lift">
            <div class="position-relative">
                ${badge ? `<div class="position-absolute top-0 start-0 m-3 z-3">${badge}</div>` : ''}
                <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-3 z-3 like-btn" data-campaign-id="${campaign.id}">
                    <i class="far fa-heart"></i>
                    <span class="like-count">${likesCount}</span>
                </button>
                <img src="${imageUrl}" alt="${campaign.title}" 
                     class="w-100 rounded-top-3" 
                     style="height: 200px; object-fit: cover;"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22%3E%3Crect fill=%22%23e9ecef%22 width=%22400%22 height=%22250%22/%3E%3Ctext fill=%22%236c757d%22 font-family=%22Arial%22 font-size=%2220%22 text-anchor=%22middle%22 x=%22200%22 y=%22135%22%3ECampaign Image%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="p-4">
                <h6 class="fw-bold mb-2 text-truncate-2">${campaign.title}</h6>
                <p class="text-muted small mb-3 text-truncate-3">${campaign.description}</p>
                
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <small class="text-muted">Tiến độ</small>
                        <small class="fw-bold text-primary">${campaign.progress}%</small>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${campaign.progress}%"></div>
                    </div>
                </div>
                
                <div class="row text-center mb-3">
                    <div class="col-4">
                        <h6 class="fw-bold text-primary mb-0 small">${campaign.collectedEth}</h6>
                        <small class="text-muted" style="font-size: 0.7rem;">ETH</small>
                    </div>
                    <div class="col-4">
                        <h6 class="fw-bold text-success mb-0 small">${supportersCount}</h6>
                        <small class="text-muted" style="font-size: 0.7rem;">Người ủng hộ</small>
                    </div>
                    <div class="col-4">
                        <h6 class="fw-bold text-info mb-0 small">${campaign.daysLeft}</h6>
                        <small class="text-muted" style="font-size: 0.7rem;">Ngày còn lại</small>
                    </div>
                </div>
                
                <div class="d-flex align-items-center mb-3">
                    <i class="fas fa-map-marker-alt text-muted me-2"></i>
                    <small class="text-muted">${campaign.location}</small>
                </div>
                
                <div class="d-flex align-items-center mb-3">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <small class="text-success">Đã xác minh</small>
                </div>
                
                <div class="d-grid">
                    <a href="campaign-detail.html?id=${campaign.id}" class="btn btn-primary">
                        <i class="fas fa-eye me-2"></i>Xem chi tiết
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
    // Total campaigns
    const totalCampaignsEl = document.getElementById('totalCampaigns');
    if (totalCampaignsEl) {
        totalCampaignsEl.textContent = campaigns.length.toLocaleString('vi-VN');
    }
    
    // Total donated
    let totalDonated = 0;
    for (const campaign of campaigns) {
        totalDonated += parseFloat(campaign.collectedEth);
    }
    
    const totalDonatedEl = document.getElementById('totalDonated');
    if (totalDonatedEl) {
        // Convert to VND (mock rate)
        const vnd = await window.smartContract.convertToVND(totalDonated);
        totalDonatedEl.textContent = formatNumber(vnd) + ' VND';
    }
    
    // Total supporters (unique)
    let totalSupporters = 0;
    for (const campaign of campaigns) {
        const count = await window.smartContract.getSupportersCount(campaign.id);
        totalSupporters += count;
    }
    
    const totalSupportersEl = document.getElementById('totalSupporters');
    if (totalSupportersEl) {
        totalSupportersEl.textContent = formatNumber(totalSupporters);
    }
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
