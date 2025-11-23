// JavaScript for Campaigns Page
class CampaignsPage {
    constructor() {
        this.campaigns = [];
        this.filteredCampaigns = [];
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.filters = {
            search: '',
            region: '',
            category: '',
            sort: 'newest'
        };
        this.init();
    }

    async init() {
        await this.loadCampaigns();
        this.setupFilters();
        this.setupEventListeners();
        this.parseURLParams();
        this.filterAndRenderCampaigns();
    }

    async loadCampaigns() {
        try {
            // Load campaigns from blockchain
            if (window.smartContract) {
                await window.smartContract.initializeContract();
                const blockchainCampaigns = await window.smartContract.getAllCampaigns();
                
                // Convert blockchain data to display format
                this.campaigns = blockchainCampaigns.map(campaign => {
                    const targetCFX = parseFloat(campaign.targetAmount);
                    const collectedCFX = parseFloat(campaign.collected);
                    const CFX_TO_VND = 70000000; // 1 CFX = 70M VND
                    
                    const targetVND = targetCFX * CFX_TO_VND;
                    const raisedVND = collectedCFX * CFX_TO_VND;
                    
                    // Calculate days left
                    let daysLeft = 0;
                    if (campaign.endDate) {
                        const endTime = new Date(campaign.endDate).getTime();
                        const now = Date.now();
                        daysLeft = Math.max(0, Math.ceil((endTime - now) / (1000 * 60 * 60 * 24)));
                    }
                    
                    return {
                        id: campaign.id,
                        title: campaign.title,
                        description: campaign.description,
                        image: campaign.media || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=250&fit=crop&auto=format&q=80",
                        targetAmount: targetVND,
                        raisedAmount: raisedVND,
                        supporters: campaign.supportersCount || 0,
                        daysLeft: daysLeft,
                        location: campaign.location || "Việt Nam",
                        region: "other",
                        category: "general",
                        isUrgent: daysLeft > 0 && daysLeft < 7,
                        isVerified: true,
                        likes: campaign.likesCount || 0,
                        createdAt: campaign.createdAt ? new Date(campaign.createdAt).getTime() : Date.now()
                    };
                });
                
                console.log('Loaded campaigns from blockchain:', this.campaigns.length);
            }
            
            // If no campaigns loaded, show empty state (no mock data)
            if (this.campaigns.length === 0) {
                console.log('No campaigns found on blockchain');
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
            this.campaigns = [];
        }
    }



    setupFilters() {
        // Initialize filter values
        this.filters.search = new URLSearchParams(window.location.search).get('search') || '';
        
        // Set initial values
        document.getElementById('searchInput').value = this.filters.search;
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            }, 300));
        }

        // Region filter
        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            regionFilter.addEventListener('change', (e) => {
                this.filters.region = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }

        // Sort filter
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }

        // Items per page
        const itemsPerPageSelect = document.getElementById('itemsPerPage');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.filterAndRenderCampaigns();
            });
        }
    }

    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('search')) {
            this.filters.search = urlParams.get('search');
            document.getElementById('searchInput').value = this.filters.search;
        }
    }

    filterAndRenderCampaigns() {
        // Apply filters
        this.filteredCampaigns = this.campaigns.filter(campaign => {
            // Search filter
            if (this.filters.search && 
                !campaign.title.toLowerCase().includes(this.filters.search.toLowerCase()) &&
                !campaign.description.toLowerCase().includes(this.filters.search.toLowerCase()) &&
                !campaign.location.toLowerCase().includes(this.filters.search.toLowerCase())) {
                return false;
            }

            // Region filter
            if (this.filters.region && campaign.region !== this.filters.region) {
                return false;
            }

            // Category filter
            if (this.filters.category && campaign.category !== this.filters.category) {
                return false;
            }

            return true;
        });

        // Apply sorting
        this.sortCampaigns();

        // Update result count
        document.getElementById('resultCount').textContent = this.filteredCampaigns.length.toLocaleString();

        // Render campaigns
        this.renderCampaigns();

        // Render pagination
        this.renderPagination();
    }

    sortCampaigns() {
        switch (this.filters.sort) {
            case 'newest':
                this.filteredCampaigns.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'urgent':
                this.filteredCampaigns.sort((a, b) => {
                    if (a.isUrgent && !b.isUrgent) return -1;
                    if (!a.isUrgent && b.isUrgent) return 1;
                    return a.daysLeft - b.daysLeft;
                });
                break;
            case 'most-donated':
                this.filteredCampaigns.sort((a, b) => b.raisedAmount - a.raisedAmount);
                break;
            case 'ending-soon':
                this.filteredCampaigns.sort((a, b) => a.daysLeft - b.daysLeft);
                break;
        }
    }

    renderCampaigns() {
        const container = document.getElementById('campaignsList');
        if (!container) return;

        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const campaignsToShow = this.filteredCampaigns.slice(startIndex, endIndex);

        if (campaignsToShow.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-search text-muted" style="font-size: 64px;"></i>
                    <h4 class="mt-3 text-muted">Không tìm thấy chiến dịch nào</h4>
                    <p class="text-muted">Thử thay đổi bộ lọc để xem thêm kết quả</p>
                </div>
            `;
            return;
        }

        container.innerHTML = campaignsToShow.map(campaign => `
            <div class="col-lg-4 col-md-6 mb-4 fade-in">
                <div class="campaign-card bg-white rounded-3 shadow-sm h-100 position-relative hover-lift">
                    ${campaign.isUrgent ? '<div class="campaign-badge position-absolute top-0 start-0 m-3"><span class="badge bg-danger">Cấp bách</span></div>' : ''}
                    
                    <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-3 like-btn" onclick="toggleLike(${campaign.id}, this)">
                        <i class="far fa-heart"></i>
                        <span class="like-count">${this.formatNumber(campaign.likes)}</span>
                    </button>
                    
                    <div class="campaign-image">
                        <img src="${campaign.image}" alt="${campaign.title}" class="w-100 rounded-top-3" style="height: 200px; object-fit: cover;" loading="lazy">
                    </div>
                    
                    <div class="p-4">
                        <h6 class="fw-bold campaign-title mb-2 text-truncate-2">${campaign.title}</h6>
                        <p class="text-muted small campaign-description mb-3 text-truncate-3">${campaign.description}</p>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small class="text-muted">Tiến độ</small>
                                <small class="fw-bold campaign-progress-text">${Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)}%</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar campaign-progress-bar" role="progressbar" style="width: ${(campaign.raisedAmount / campaign.targetAmount) * 100}%"></div>
                            </div>
                        </div>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <h6 class="fw-bold text-primary mb-0 campaign-raised">${this.formatCurrency(campaign.raisedAmount)}</h6>
                                <small class="text-muted">Đã quyên góp</small>
                            </div>
                            <div class="col-4">
                                <h6 class="fw-bold text-success mb-0 campaign-supporters">${this.formatNumber(campaign.supporters)}</h6>
                                <small class="text-muted">Người ủng hộ</small>
                            </div>
                            <div class="col-4">
                                <h6 class="fw-bold text-info mb-0 campaign-days-left">${campaign.daysLeft}</h6>
                                <small class="text-muted">Ngày còn lại</small>
                            </div>
                        </div>
                        
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-map-marker-alt text-muted me-2"></i>
                            <small class="text-muted campaign-location">${campaign.location}</small>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <a href="campaign-detail.html?id=${campaign.id}" class="btn btn-primary campaign-detail-btn">
                                <i class="fas fa-eye me-2"></i>Xem chi tiết
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Add fade-in animation
        setTimeout(() => {
            container.querySelectorAll('.fade-in').forEach((el, index) => {
                setTimeout(() => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 50);
    }

    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        const totalPages = Math.ceil(this.filteredCampaigns.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${totalPages})">${totalPages}</a></li>`;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(page) {
        const totalPages = Math.ceil(this.filteredCampaigns.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderCampaigns();
        this.renderPagination();
        
        // Scroll to top
        document.querySelector('.py-5').scrollIntoView({ behavior: 'smooth' });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num.toLocaleString();
    }

    formatCurrency(amount) {
        if (amount >= 1000000000) {
            return (amount / 1000000000).toFixed(1) + 'B';
        }
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(0) + 'M';
        }
        if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'K';
        }
        return this.formatNumber(amount);
    }

    debounce(func, wait) {
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
}

// Global functions
window.changePage = (page) => {
    if (campaignsPage) {
        campaignsPage.changePage(page);
    }
};

window.toggleLike = async (campaignId, buttonElement) => {
    const heartIcon = buttonElement.querySelector('i');
    const likeCount = buttonElement.querySelector('.like-count');
    
    // Toggle like state
    const isLiked = heartIcon.classList.contains('fas');
    if (isLiked) {
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        buttonElement.classList.remove('liked');
        // Decrease count (this is just for demo, should be handled by backend)
        const currentText = likeCount.textContent;
        let currentCount = parseInt(currentText.replace(/[KM]/g, '')) || 0;
        if (currentText.includes('K')) currentCount *= 1000;
        if (currentText.includes('M')) currentCount *= 1000000;
        likeCount.textContent = campaignsPage.formatNumber(Math.max(0, currentCount - 1));
    } else {
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        buttonElement.classList.add('liked');
        // Increase count
        const currentText = likeCount.textContent;
        let currentCount = parseInt(currentText.replace(/[KM]/g, '')) || 0;
        if (currentText.includes('K')) currentCount *= 1000;
        if (currentText.includes('M')) currentCount *= 1000000;
        likeCount.textContent = campaignsPage.formatNumber(currentCount + 1);
    }
    
    // Add animation
    buttonElement.classList.add('success-animation');
    setTimeout(() => {
        buttonElement.classList.remove('success-animation');
    }, 600);
    
    // Here you would typically save the like to backend
    console.log(isLiked ? 'Unliked campaign ' + campaignId : 'Liked campaign ' + campaignId);
};

// Initialize campaigns page
let campaignsPage;
document.addEventListener('DOMContentLoaded', () => {
    campaignsPage = new CampaignsPage();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }
    
    .success-animation {
        animation: successPulse 0.6s ease-in-out;
    }
    
    @keyframes successPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .page-link {
        border-radius: 8px;
        margin: 0 2px;
        border: 1px solid #dee2e6;
    }
    
    .page-item.active .page-link {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
    }
    
    .hover-lift:hover {
        transform: translateY(-5px);
        transition: transform 0.3s ease;
    }
`;
document.head.appendChild(style);
