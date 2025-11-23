// My Donations Page Handler
// Use unique variable names to avoid conflicts with other scripts
var myDonationsAccount = null;
var myDonationsAll = [];
var myDonationsFiltered = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('My Donations page loaded');
    
    // Wait a bit longer for wallet-connect.js to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check wallet connection
    if (window.walletConnection) {
        myDonationsAccount = window.walletConnection.getCurrentAccount();
        console.log('My Donations: Current account:', myDonationsAccount);
    } else {
        console.warn('walletConnection not available yet');
    }
    
    // Always load donations for demo
    await loadMyDonations();
    initializeFilters();
});

// Load user's donations from blockchain
async function loadMyDonations() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const donationsList = document.getElementById('donationsList');
    
    try {
        loadingState.classList.remove('d-none');
        emptyState.classList.add('d-none');
        
        // Load donations from blockchain
        if (window.smartContract && window.walletAddress) {
            await window.smartContract.initializeContract();
            const campaigns = await window.smartContract.getAllCampaigns();
            const CFX_TO_VND = 70000000; // 1 CFX = 70M VND
            
            // Get donations from all campaigns for current user
            for (const campaign of campaigns) {
                if (campaign.donations && campaign.donations.length > 0) {
                    const userDonations = campaign.donations.filter(
                        d => d.donor.toLowerCase() === window.walletAddress.toLowerCase()
                    );
                    
                    // Convert blockchain data to display format
                    userDonations.forEach(donation => {
                        const amountCFX = parseFloat(donation.amount);
                        
                        myDonationsAll.push({
                            id: donation.donationId || `${campaign.id}-${donation.timestamp}`,
                            campaignId: campaign.id,
                            campaignTitle: campaign.title,
                            campaignImage: campaign.media || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=250&fit=crop&auto=format&q=80",
                            amount: amountCFX * CFX_TO_VND,
                            date: donation.timestamp ? new Date(donation.timestamp * 1000).toISOString() : new Date().toISOString(),
                            status: 'success',
                            txHash: donation.transactionHash || 'N/A',
                            message: donation.message || '',
                            impactMessage: `Bạn đã góp phần giúp đỡ ${campaign.title}`
                        });
                    });
                }
            }
        }
        
        console.log('Loaded donations from blockchain:', myDonationsAll.length);
        
        if (myDonationsAll.length === 0) {
            showEmptyState('no-donations');
            return;
        }
        
        // Update summary statistics
        updateSummaryStats(myDonationsAll);
        
        // Display donations
        myDonationsFiltered = [...myDonationsAll];
        renderDonations(myDonationsFiltered);
        
    } catch (error) {
        console.error('Error loading donations:', error);
        showEmptyState('no-donations');
    } finally {
        loadingState.classList.add('d-none');
    }
}

// Update summary statistics
function updateSummaryStats(donations) {
    const totalAmount = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const uniqueCampaigns = new Set(donations.map(d => d.campaignId)).size;
    const totalImpact = donations.reduce((sum, d) => sum + d.impact, 0);
    
    document.getElementById('totalDonationAmount').textContent = formatCurrency(totalAmount);
    document.getElementById('totalDonations').textContent = donations.length;
    document.getElementById('campaignsSupported').textContent = uniqueCampaigns;
    document.getElementById('impactScore').textContent = totalImpact;
}

// Render donations list
function renderDonations(donations) {
    const donationsList = document.getElementById('donationsList');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (donations.length === 0) {
        showEmptyState('no-results');
        return;
    }
    
    // Clear previous donations (except loading/empty states)
    const cards = donationsList.querySelectorAll('.donation-card');
    cards.forEach(card => card.remove());
    
    donations.forEach(donation => {
        const card = createDonationCard(donation);
        donationsList.appendChild(card);
    });
    
    // Show/hide load more button
    if (donations.length >= 10) {
        loadMoreContainer.classList.remove('d-none');
    } else {
        loadMoreContainer.classList.add('d-none');
    }
}

// Create donation card HTML
function createDonationCard(donation) {
    const col = document.createElement('div');
    col.className = 'col-12 donation-card mb-3';
    
    const statusBadge = getStatusBadge(donation.status);
    const categoryIcon = getCategoryIcon(donation.campaignCategory);
    
    col.innerHTML = `
        <div class="card border-0 shadow-sm hover-shadow-lg transition-all">
            <div class="card-body">
                <div class="row align-items-center">
                    <!-- Campaign Info -->
                    <div class="col-lg-6 mb-3 mb-lg-0">
                        <div class="d-flex align-items-start">
                            <div class="bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                                <i class="${categoryIcon} text-primary fs-4"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="fw-bold mb-2">${donation.campaignTitle}</h5>
                                <div class="d-flex flex-wrap gap-2 mb-2">
                                    <span class="badge bg-light text-dark">
                                        <i class="fas fa-tag me-1"></i>${donation.campaignCategory}
                                    </span>
                                    ${statusBadge}
                                </div>
                                <p class="text-muted small mb-0">
                                    <i class="far fa-clock me-1"></i>
                                    ${formatDate(donation.date)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Amount & Impact -->
                    <div class="col-lg-3 col-6 mb-3 mb-lg-0 text-center">
                        <div class="border-start ps-3">
                            <h4 class="fw-bold text-success mb-1">
                                ${formatCurrency(donation.amount)}
                            </h4>
                            <p class="text-muted small mb-0">
                                ≈ ${donation.amountCFX} CFX
                            </p>
                            <div class="mt-2">
                                <span class="badge bg-info">
                                    <i class="fas fa-hand-holding-heart me-1"></i>
                                    +${donation.impact} điểm tác động
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="col-lg-3 col-6 text-end">
                        <a href="campaign-detail.html?id=${donation.campaignId}" 
                           class="btn btn-outline-primary btn-sm mb-2 w-100">
                            <i class="fas fa-eye me-1"></i>Xem chiến dịch
                        </a>
                        <button class="btn btn-outline-secondary btn-sm w-100" 
                                onclick="viewTransaction('${donation.transactionHash}')">
                            <i class="fas fa-receipt me-1"></i>Xem giao dịch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'completed': '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Hoàn thành</span>',
        'pending': '<span class="badge bg-warning"><i class="fas fa-clock me-1"></i>Đang xử lý</span>',
        'active': '<span class="badge bg-info"><i class="fas fa-spinner me-1"></i>Đang hoạt động</span>'
    };
    return badges[status] || badges['completed'];
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'Giáo dục': 'fas fa-graduation-cap',
        'Y tế': 'fas fa-heartbeat',
        'Nhà ở': 'fas fa-home',
        'Môi trường': 'fas fa-leaf',
        'Cứu trợ': 'fas fa-hands-helping'
    };
    return icons[category] || 'fas fa-heart';
}

// Format date
function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hôm nay';
    } else if (diffDays === 1) {
        return 'Hôm qua';
    } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} tuần trước`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} tháng trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

// Initialize filters and search
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const sortBy = document.getElementById('sortBy');
    
    searchInput.addEventListener('input', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
    sortBy.addEventListener('change', applyFilters);
}

// Apply filters and sorting
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const sortOption = document.getElementById('sortBy').value;
    
    // Filter donations
    myDonationsFiltered = myDonationsAll.filter(donation => {
        const matchesSearch = donation.campaignTitle.toLowerCase().includes(searchTerm) ||
                            donation.campaignCategory.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // Sort donations
    myDonationsFiltered.sort((a, b) => {
        switch (sortOption) {
            case 'date-desc':
                return b.date - a.date;
            case 'date-asc':
                return a.date - b.date;
            case 'amount-desc':
                return parseFloat(b.amount) - parseFloat(a.amount);
            case 'amount-asc':
                return parseFloat(a.amount) - parseFloat(b.amount);
            default:
                return 0;
        }
    });
    
    renderDonations(myDonationsFiltered);
}

// Show empty state
function showEmptyState(type) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const donationsList = document.getElementById('donationsList');
    
    loadingState.classList.add('d-none');
    
    if (type === 'no-wallet') {
        emptyState.querySelector('h4').textContent = 'Vui lòng kết nối ví';
        emptyState.querySelector('p').textContent = 'Bạn cần kết nối ví để xem lịch sử quyên góp';
        emptyState.querySelector('.btn').innerHTML = '<i class="fas fa-wallet me-2"></i>Kết nối ví';
        emptyState.querySelector('.btn').onclick = () => window.walletConnection.connectWallet();
    } else if (type === 'error') {
        emptyState.querySelector('h4').textContent = 'Đã có lỗi xảy ra';
        emptyState.querySelector('p').textContent = 'Không thể tải lịch sử quyên góp. Vui lòng thử lại sau.';
        emptyState.querySelector('.btn').innerHTML = '<i class="fas fa-redo me-2"></i>Thử lại';
        emptyState.querySelector('.btn').onclick = () => location.reload();
    }
    
    emptyState.classList.remove('d-none');
}

// View transaction on blockchain explorer
function viewTransaction(txHash) {
    const explorerUrl = `https://evmtestnet.confluxscan.io/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format currency helper function
function formatCurrency(amount) {
    if (window.smartContract && window.smartContract.formatCurrency) {
        return window.smartContract.formatCurrency(amount);
    }
    
    // Fallback formatting
    const num = parseFloat(amount);
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B VND';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M VND';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K VND';
    }
    return num.toLocaleString('vi-VN') + ' VND';
}

console.log('My Donations module initialized');
