// Main JavaScript for QuyTuThien Home Page
class QuyTuThienApp {
    constructor() {
        this.campaigns = [];
        this.stats = {
            totalCampaigns: 0,
            totalDonated: 0,
            totalSupporters: 0
        };
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadFeaturedCampaigns();
        this.updateStatsDisplay();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    async loadStats() {
        try {
            // Load real stats from blockchain
            if (window.smartContract) {
                await window.smartContract.initializeContract();
                const campaignCount = await window.smartContract.getCampaignCount();
                this.stats.totalCampaigns = campaignCount;
                
                // Calculate total donated from all campaigns
                const campaigns = await window.smartContract.getAllCampaigns();
                let totalDonated = 0;
                let totalSupporters = 0;
                const CFX_TO_VND = 70000000;
                
                campaigns.forEach(campaign => {
                    const collectedCFX = parseFloat(campaign.collected);
                    const collectedVND = collectedCFX * CFX_TO_VND;
                    totalDonated += collectedVND;
                    totalSupporters += campaign.supportersCount || 0;
                });
                
                this.stats.totalDonated = totalDonated;
                this.stats.totalSupporters = totalSupporters;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadFeaturedCampaigns() {
        try {
            // Load featured campaigns from blockchain
            if (window.smartContract) {
                await window.smartContract.initializeContract();
                const allCampaigns = await window.smartContract.getAllCampaigns();
                
                // Convert blockchain data and take top 3 campaigns
                this.campaigns = allCampaigns.slice(0, 3).map(campaign => {
                    const targetCFX = parseFloat(campaign.targetAmount);
                    const collectedCFX = parseFloat(campaign.collected);
                    const CFX_TO_VND = 70000000; // 1 CFX = 70M VND
                    
                    const targetVND = targetCFX * CFX_TO_VND;
                    const raisedVND = collectedCFX * CFX_TO_VND;
                    
                    return {
                        id: campaign.id,
                        title: campaign.title,
                        description: campaign.description,
                        image: campaign.media || "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=250&fit=crop&auto=format&q=80",
                        organizer: campaign.organizer || "Tổ chức từ thiện",
                        targetAmount: targetVND,
                        raisedAmount: raisedVND,
                        supporters: campaign.supportersCount || 0,
                        daysLeft: 30,
                        location: campaign.location || "Việt Nam",
                        isVerified: true,
                        isUrgent: false,
                        likes: campaign.likesCount || 0,
                        organizerRole: "Người tổ chức"
                    };
                });
            }
            
            this.renderFeaturedCampaigns();
        } catch (error) {
            console.error('Error loading campaigns:', error);
            this.campaigns = [];
            this.renderFeaturedCampaigns();
        }
    }

    renderFeaturedCampaigns() {
        const container = document.getElementById('featuredCampaigns');
        if (!container) return;

        // Check if there are campaigns
        if (this.campaigns.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Chưa có chiến dịch nào</h5>
                    <p class="text-muted">Vui lòng kết nối ví và đợi dữ liệu từ blockchain</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.campaigns.map(campaign => `
            <div class="col-lg-4 col-md-6 mb-4 fade-in-up">
                <div class="campaign-card bg-white rounded-3 shadow-sm h-100 position-relative hover-lift">
                    ${campaign.isUrgent ? '<div class="position-absolute top-0 start-0 m-3"><span class="badge bg-danger">Cấp bách</span></div>' : ''}
                    
                    <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-3 like-btn" onclick="toggleLike(${campaign.id})">
                        <i class="far fa-heart"></i>
                        <span class="like-count">${this.formatNumber(campaign.likes)}</span>
                    </button>
                    
                    <div class="campaign-image">
                        <img src="${campaign.image}" alt="${campaign.title}" class="w-100 rounded-top-3" style="height: 200px; object-fit: cover;">
                    </div>
                    
                    <div class="p-4">
                        <h6 class="fw-bold mb-2 text-truncate-2">${campaign.title}</h6>
                        <p class="text-muted small mb-3 text-truncate-3">${campaign.description}</p>
                        
                        ${campaign.organizer ? `
                        <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                            <div class="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 40px; height: 40px; min-width: 40px;">
                                <i class="fas fa-user text-primary"></i>
                            </div>
                            <div class="flex-grow-1 overflow-hidden">
                                <div class="fw-bold small text-truncate">${campaign.organizer}</div>
                                <div class="text-muted" style="font-size: 0.75rem;">${campaign.organizerRole || 'Người phụ trách'}</div>
                            </div>
                            ${campaign.isVerified ? '<i class="fas fa-check-circle text-success" title="Đã xác thực"></i>' : ''}
                        </div>
                        ` : ''}
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small class="text-muted">Tiến độ</small>
                                <small class="fw-bold">${Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)}%</small>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar" role="progressbar" style="width: ${(campaign.raisedAmount / campaign.targetAmount) * 100}%"></div>
                            </div>
                        </div>
                        
                        <div class="row text-center mb-3">
                            <div class="col-4">
                                <h6 class="fw-bold text-primary mb-0">${this.formatCurrency(campaign.raisedAmount)}</h6>
                                <small class="text-muted">Đã quyên góp</small>
                            </div>
                            <div class="col-4">
                                <h6 class="fw-bold text-success mb-0">${this.formatNumber(campaign.supporters)}</h6>
                                <small class="text-muted">Người ủng hộ</small>
                            </div>
                            <div class="col-4">
                                <h6 class="fw-bold text-info mb-0">${campaign.daysLeft}</h6>
                                <small class="text-muted">Ngày còn lại</small>
                            </div>
                        </div>
                        
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-map-marker-alt text-muted me-2"></i>
                            <small class="text-muted">${campaign.location}</small>
                        </div>
                        
                        <div class="d-grid">
                            <a href="campaign-detail.html?id=${campaign.id}" class="btn btn-primary">
                                <i class="fas fa-eye me-2"></i>Xem chi tiết
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStatsDisplay() {
        // Update hero stats
        this.updateElement('totalCampaigns', this.formatNumber(this.stats.totalCampaigns));
        this.updateElement('totalDonated', this.formatCurrency(this.stats.totalDonated));
        this.updateElement('totalSupporters', this.formatNumber(this.stats.totalSupporters));
        
        // Update footer stats (with default values if not present)
        this.updateElement('blockHeight', this.formatNumber(18456789));
        this.updateElement('totalTx', this.formatNumber(1234567));
        this.updateElement('gasPrice', '21 Gwei');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            // Add animation
            element.style.opacity = '0';
            setTimeout(() => {
                element.textContent = value;
                element.style.opacity = '1';
            }, 150);
        }
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
            return (amount / 1000000000).toFixed(1) + 'B VND';
        }
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(0) + 'M VND';
        }
        if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'K VND';
        }
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    }

    setupEventListeners() {
        // Scroll animations
        this.setupScrollAnimations();
        
        // Search functionality
        const searchForm = document.querySelector('.hero-section form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchTerm = e.target.querySelector('input').value;
                window.location.href = `campaigns.html?search=${encodeURIComponent(searchTerm)}`;
            });
        }
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        // Observe all campaign cards
        document.querySelectorAll('.campaign-card').forEach(card => {
            observer.observe(card);
        });
    }

    startRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(async () => {
            await this.loadStats();
            this.updateStatsDisplay();
        }, 30000);
    }
}

// Global functions
window.toggleLike = async (campaignId) => {
    const likeBtn = document.querySelector(`[onclick="toggleLike(${campaignId})"]`);
    const heartIcon = likeBtn.querySelector('i');
    const likeCount = likeBtn.querySelector('.like-count');
    
    // Toggle like state
    const isLiked = heartIcon.classList.contains('fas');
    if (isLiked) {
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        likeBtn.classList.remove('liked');
        const currentCount = parseInt(likeCount.textContent.replace('K', '').replace('M', '')) || 0;
        likeCount.textContent = app.formatNumber(currentCount - 1);
    } else {
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        likeBtn.classList.add('liked');
        const currentCount = parseInt(likeCount.textContent.replace('K', '').replace('M', '')) || 0;
        likeCount.textContent = app.formatNumber(currentCount + 1);
    }
    
    // Add animation
    likeBtn.classList.add('success-animation');
    setTimeout(() => {
        likeBtn.classList.remove('success-animation');
    }, 600);
    
    console.log(isLiked ? 'Unliked campaign ' + campaignId : 'Liked campaign ' + campaignId);
};

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new QuyTuThienApp();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .success-animation {
        animation: successPulse 0.6s ease-in-out;
    }
    
    @keyframes successPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    .hover-lift {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);
