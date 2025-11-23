// Campaigns page JavaScript
let allCampaigns = [];
let filteredCampaigns = [];
let currentPage = 1;
let itemsPerPage = 12;

document.addEventListener('DOMContentLoaded', async function() {
    await loadAllCampaigns();
    initializeFilters();
    
    window.addEventListener('walletConnected', () => {
        loadAllCampaigns();
    });
});

async function loadAllCampaigns() {
    const container = document.getElementById('campaignsList');
    if (!container) return;
    
    try {
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
                const provider = new ethers.providers.JsonRpcProvider('https://evmtestnet.confluxrpc.com');
                await window.smartContract.initialize(provider, provider);
            }
        }
        
        allCampaigns = await window.smartContract.getAllCampaigns();
        filteredCampaigns = [...allCampaigns];
        
        if (allCampaigns.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Chưa có chiến dịch nào</p>
                </div>
            `;
            return;
        }
        
        applyFilters();
        
    } catch (error) {
        console.error('Error loading campaigns:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="text-danger">Lỗi khi tải dữ liệu</p>
                <button class="btn btn-primary" onclick="loadAllCampaigns()">Thử lại</button>
            </div>
        `;
    }
}

function initializeFilters() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 500));
    }
    
    // Region filter
    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', applyFilters);
    }
    
    // Category filter  
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
    
    // Items per page
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            renderCampaigns();
        });
    }
}

function applyFilters() {
    filteredCampaigns = [...allCampaigns];
    
    // Search filter
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        filteredCampaigns = filteredCampaigns.filter(c => 
            c.title.toLowerCase().includes(searchTerm) ||
            c.description.toLowerCase().includes(searchTerm) ||
            c.location.toLowerCase().includes(searchTerm)
        );
    }
    
    // Region filter
    const region = document.getElementById('regionFilter')?.value;
    if (region) {
        filteredCampaigns = filteredCampaigns.filter(c => 
            c.location.toLowerCase().includes(region.toLowerCase())
        );
    }
    
    // Sort
    const sortBy = document.getElementById('sortFilter')?.value || 'newest';
    switch (sortBy) {
        case 'newest':
            filteredCampaigns.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case 'urgent':
            filteredCampaigns.sort((a, b) => a.daysLeft - b.daysLeft);
            break;
        case 'most-donated':
            filteredCampaigns.sort((a, b) => parseFloat(b.collectedEth) - parseFloat(a.collectedEth));
            break;
        case 'ending-soon':
            filteredCampaigns.sort((a, b) => a.daysLeft - b.daysLeft);
            break;
    }
    
    // Update result count
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = filteredCampaigns.length.toLocaleString('vi-VN');
    }
    
    currentPage = 1;
    renderCampaigns();
}

async function renderCampaigns() {
    const container = document.getElementById('campaignsList');
    if (!container) return;
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const campaignsToShow = filteredCampaigns.slice(startIndex, endIndex);
    
    if (campaignsToShow.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Không tìm thấy chiến dịch phù hợp</p>
            </div>
        `;
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Render campaigns
    for (const campaign of campaignsToShow) {
        const card = await createCampaignCard(campaign);
        container.appendChild(card);
    }
    
    // Render pagination
    renderPagination();
}

async function createCampaignCard(campaign) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4 fade-in-up';
    
    const supportersCount = await window.smartContract.getSupportersCount(campaign.id);
    const likesCount = await window.smartContract.getLikesCount(campaign.id);
    
    let badge = '';
    if (!campaign.active) {
        badge = '<span class="badge bg-secondary">Đã kết thúc</span>';
    } else if (campaign.daysLeft < 7) {
        badge = '<span class="badge bg-danger">Sắp kết thúc</span>';
    } else if (campaign.progress >= 75) {
        badge = '<span class="badge bg-success">Gần đạt mục tiêu</span>';
    } else {
        badge = '<span class="badge bg-primary">Đang diễn ra</span>';
    }
    
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
    
    const likeBtn = col.querySelector('.like-btn');
    likeBtn.addEventListener('click', (e) => handleLike(e, campaign.id));
    
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

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    
    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(1); return false;">1</a>
            </li>
        `;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="changePage(${totalPages}); return false;">${totalPages}</a>
            </li>
        `;
    }
    
    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderCampaigns();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showAlert('Lỗi: ' + error.message, 'danger');
    } finally {
        btn.disabled = false;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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
