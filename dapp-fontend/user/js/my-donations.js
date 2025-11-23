// My Donations Page JavaScript
let userDonations = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Wait for wallet connection
    if (!window.walletConnection || !window.walletConnection.isConnected) {
        showEmptyState('Vui lòng kết nối ví để xem lịch sử quyên góp');
        return;
    }
    
    await loadUserDonations();
    
    // Listen for wallet events
    window.addEventListener('walletConnected', () => {
        loadUserDonations();
    });
    
    window.addEventListener('walletDisconnected', () => {
        showEmptyState('Vui lòng kết nối ví để xem lịch sử quyên góp');
    });
    
    window.addEventListener('accountChanged', () => {
        loadUserDonations();
    });
});

async function loadUserDonations() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const donationsList = document.getElementById('donationsList');
    
    try {
        // Show loading
        if (loadingState) loadingState.style.display = 'block';
        if (emptyState) emptyState.classList.add('d-none');
        if (donationsList) {
            Array.from(donationsList.children).forEach(child => {
                if (child !== loadingState && child !== emptyState) {
                    child.remove();
                }
            });
        }
        
        // Initialize contract if not already initialized
        if (!window.smartContract.contract) {
            if (window.walletConnection && window.walletConnection.isConnected) {
                const provider = window.walletConnection.getProvider();
                const signer = window.walletConnection.getSigner();
                await window.smartContract.initialize(provider, signer);
            } else {
                showEmptyState('Vui lòng kết nối ví để xem lịch sử quyên góp');
                return;
            }
        }
        
        const userAddress = window.walletConnection.getAccount();
        userDonations = await window.smartContract.getUserDonations(userAddress);
        
        // Hide loading
        if (loadingState) loadingState.style.display = 'none';
        
        if (userDonations.length === 0) {
            if (emptyState) emptyState.classList.remove('d-none');
            updateSummary(0, 0, 0);
            return;
        }
        
        // Render donations
        renderDonations();
        
        // Update summary
        calculateSummary();
        
    } catch (error) {
        console.error('Error loading user donations:', error);
        if (loadingState) loadingState.style.display = 'none';
        showAlert('Lỗi khi tải dữ liệu quyên góp', 'danger');
    }
}

function renderDonations() {
    const donationsList = document.getElementById('donationsList');
    if (!donationsList) return;
    
    // Clear existing donations (except loading and empty states)
    Array.from(donationsList.children).forEach(child => {
        if (child.id !== 'loadingState' && child.id !== 'emptyState') {
            child.remove();
        }
    });
    
    // Sort by most recent
    const sortedDonations = [];
    userDonations.forEach(item => {
        item.donations.forEach(donation => {
            sortedDonations.push({
                campaign: item.campaign,
                donation: donation
            });
        });
    });
    
    sortedDonations.sort((a, b) => b.donation.timestamp - a.donation.timestamp);
    
    // Render each donation
    sortedDonations.forEach(item => {
        const card = createDonationCard(item.campaign, item.donation);
        donationsList.appendChild(card);
    });
}

function createDonationCard(campaign, donation) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4 mb-4 fade-in-up';
    
    const statusBadge = campaign.active ? 
        '<span class="badge bg-success">Đang hoạt động</span>' : 
        '<span class="badge bg-secondary">Đã kết thúc</span>';
    
    const imageUrl = campaign.media || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=200&fit=crop';
    
    col.innerHTML = `
        <div class="card border-0 shadow-sm h-100 hover-shadow-lg transition-all">
            <div class="position-relative">
                <img src="${imageUrl}" 
                     class="card-img-top" 
                     alt="${campaign.title}"
                     style="height: 180px; object-fit: cover;"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22180%22%3E%3Crect fill=%22%23e9ecef%22 width=%22400%22 height=%22180%22/%3E%3Ctext fill=%22%236c757d%22 font-family=%22Arial%22 font-size=%2218%22 text-anchor=%22middle%22 x=%22200%22 y=%22100%22%3ECampaign%3C/text%3E%3C/svg%3E'">
                <div class="position-absolute top-0 end-0 m-2">
                    ${statusBadge}
                </div>
            </div>
            <div class="card-body">
                <h6 class="card-title fw-bold mb-2 text-truncate-2">${campaign.title}</h6>
                
                <div class="bg-light rounded p-3 mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted small">Số tiền ủng hộ:</span>
                        <strong class="text-primary">${donation.amountEth} ETH</strong>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted small">Thời gian:</span>
                        <small>${window.smartContract.formatDate(donation.timestamp)}</small>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted small">Block:</span>
                        <small class="font-monospace">#${donation.blockNumber}</small>
                    </div>
                </div>
                
                <div class="mb-3">
                    <small class="text-muted d-block mb-1">Transaction Hash:</small>
                    <div class="d-flex align-items-center gap-2">
                        <code class="small flex-grow-1 text-truncate bg-light p-2 rounded">${donation.txHash}</code>
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="copyToClipboard('${donation.txHash}')"
                                title="Copy">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="row g-2">
                    <div class="col-6">
                        <a href="campaign-detail.html?id=${campaign.id}" 
                           class="btn btn-sm btn-outline-primary w-100">
                            <i class="fas fa-eye me-1"></i>Xem chiến dịch
                        </a>
                    </div>
                    <div class="col-6">
                        <a href="https://etherscan.io/tx/${donation.txHash}" 
                           target="_blank"
                           class="btn btn-sm btn-outline-success w-100">
                            <i class="fas fa-external-link-alt me-1"></i>Etherscan
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="card-footer bg-transparent border-top-0">
                <div class="d-flex align-items-center text-success">
                    <i class="fas fa-check-circle me-2"></i>
                    <small>Giao dịch đã xác thực trên blockchain</small>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

async function calculateSummary() {
    let totalAmount = 0;
    let totalDonations = 0;
    const campaignsSet = new Set();
    
    userDonations.forEach(item => {
        campaignsSet.add(item.campaign.id);
        item.donations.forEach(donation => {
            totalAmount += parseFloat(donation.amountEth);
            totalDonations++;
        });
    });
    
    // Convert to VND
    const totalVND = await window.smartContract.convertToVND(totalAmount);
    
    // Calculate impact score (mock calculation)
    const impactScore = Math.floor(totalAmount * 100);
    
    updateSummary(totalVND, totalDonations, campaignsSet.size, impactScore);
}

function updateSummary(totalAmount, donationCount, campaignCount, impactScore = 0) {
    const totalDonationAmountEl = document.getElementById('totalDonationAmount');
    if (totalDonationAmountEl) {
        totalDonationAmountEl.textContent = totalAmount.toLocaleString('vi-VN') + ' VND';
    }
    
    const totalDonationsEl = document.getElementById('totalDonations');
    if (totalDonationsEl) {
        totalDonationsEl.textContent = donationCount.toLocaleString('vi-VN');
    }
    
    const campaignsSupportedEl = document.getElementById('campaignsSupported');
    if (campaignsSupportedEl) {
        campaignsSupportedEl.textContent = campaignCount.toLocaleString('vi-VN');
    }
    
    const impactScoreEl = document.getElementById('impactScore');
    if (impactScoreEl) {
        impactScoreEl.textContent = impactScore.toLocaleString('vi-VN');
    }
}

function showEmptyState(message) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) {
        emptyState.classList.remove('d-none');
        const messageEl = emptyState.querySelector('h4');
        if (messageEl && message) {
            messageEl.textContent = message;
        }
    }
    
    updateSummary(0, 0, 0, 0);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Đã sao chép vào clipboard', 'success');
    }).catch(err => {
        console.error('Error copying:', err);
        showAlert('Lỗi khi sao chép', 'danger');
    });
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

// Make functions global
window.copyToClipboard = copyToClipboard;
