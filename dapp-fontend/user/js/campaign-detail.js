// JavaScript for Campaign Detail Page
class CampaignDetailPage {
    constructor() {
        this.campaignId = null;
        this.campaign = null;
        this.supporters = [];
        this.comments = [];
        this.incomeStatements = [];
        this.expenseStatements = [];
        this.updates = [];
        this.currentTab = 'story';
        this.init();
    }

    async init() {
        this.getCampaignIdFromURL();
        await this.loadCampaignData();
        this.setupEventListeners();
        this.setupTabs();
        this.updateUI();
    }

    getCampaignIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.campaignId = urlParams.get('id') || 1;
    }

    async loadCampaignData() {
        try {
            // Mock campaign data - in production, this would come from smart contract
            this.campaign = {
                id: this.campaignId,
                title: "Hỗ trợ xây dựng trường học cho trẻ em vùng cao",
                description: "Chiến dịch quyên góp xây dựng trường học cho 200 trẻ em tại vùng núi cao Sapa, Lào Cai. Hiện tại các em phải đi bộ hơn 10km mỗi ngày để đến trường.",
                targetAmount: 3000000000,
                raisedAmount: 2450000000,
                supporters: 1456,
                daysLeft: 45,
                location: "Sapa, Lào Cai",
                category: "education",
                isUrgent: true,
                isVerified: true,
                likes: 1234,
                contractAddress: "0x1234567890123456789012345678901234567890",
                beneficiary: "0x9876543210987654321098765432109876543210",
                createdAt: Date.now() - 86400000 * 10
            };

            await this.loadSupporters();
            await this.loadComments();
            await this.loadStatements();
            await this.loadUpdates();
        } catch (error) {
            console.error('Error loading campaign data:', error);
        }
    }

    async loadSupporters() {
        // Mock supporters data
        this.supporters = [
            {
                id: 1,
                address: "0x1234...abcd",
                amount: 5000000, // 5M VND
                timestamp: Date.now() - 3600000,
                txHash: "0x1234567890abcdef1234567890abcdef12345678",
                message: "Chúc các em học tập tốt!",
                isAnonymous: false
            },
            {
                id: 2,
                address: "Anonymous",
                amount: 2000000,
                timestamp: Date.now() - 7200000,
                txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
                message: "Ủng hộ các em nhé!",
                isAnonymous: true
            },
            {
                id: 3,
                address: "0x5678...efgh",
                amount: 10000000,
                timestamp: Date.now() - 10800000,
                txHash: "0x567890abcdef1234567890abcdef1234567890ab",
                message: "Mong các em có trường học đẹp",
                isAnonymous: false
            }
        ];

        // Generate more supporters
        for (let i = 4; i <= 50; i++) {
            this.supporters.push({
                id: i,
                address: Math.random() > 0.3 ? `0x${Math.random().toString(16).substr(2, 4)}...${Math.random().toString(16).substr(2, 4)}` : "Anonymous",
                amount: Math.floor(Math.random() * 20000000) + 100000,
                timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 30),
                txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
                message: ["Chúc các em học tốt!", "Ủng hộ giáo dục!", "Mong hoàn thành sớm", ""][Math.floor(Math.random() * 4)],
                isAnonymous: Math.random() > 0.7
            });
        }

        this.supporters.sort((a, b) => b.timestamp - a.timestamp);
    }

    async loadComments() {
        // Mock comments data
        this.comments = [
            {
                id: 1,
                userAddress: "0x1234...abcd",
                userName: "Nguyễn Văn A",
                content: "Dự án rất ý nghĩa! Mình sẽ ủng hộ và chia sẻ để mọi người cùng biết.",
                type: "support",
                timestamp: Date.now() - 3600000,
                likes: 12,
                replies: []
            },
            {
                id: 2,
                userAddress: "0x5678...efgh",
                userName: "Trần Thị B",
                content: "Có thể cho biết tiến độ xây dựng hiện tại như thế nào không ạ?",
                type: "question",
                timestamp: Date.now() - 7200000,
                likes: 5,
                replies: [
                    {
                        id: 21,
                        userAddress: "0x9999...1111",
                        userName: "Admin",
                        content: "Chúng tôi sẽ cập nhật tiến độ trong tab cập nhật ạ. Hiện tại đang khảo sát địa điểm.",
                        timestamp: Date.now() - 6900000,
                        likes: 3
                    }
                ]
            }
        ];
    }

    async loadStatements() {
        // Mock income statements (donations)
        this.incomeStatements = [
            {
                txHash: "0x1234567890abcdef1234567890abcdef12345678",
                fromAddress: "0x1234...abcd",
                amount: 5000000,
                timestamp: Date.now() - 3600000,
                blockNumber: 18456789,
                status: "success"
            },
            {
                txHash: "0xabcdef1234567890abcdef1234567890abcdef12",
                fromAddress: "0x5678...efgh",
                amount: 10000000,
                timestamp: Date.now() - 7200000,
                blockNumber: 18456788,
                status: "success"
            }
        ];

        // Mock expense statements (withdrawals)
        this.expenseStatements = [
            {
                txHash: "0x9876543210987654321098765432109876543210",
                toAddress: "0xabcd...1234",
                amount: 200000000,
                timestamp: Date.now() - 86400000 * 5,
                blockNumber: 18450000,
                purpose: "Mua vật liệu xây dựng đợt 1"
            },
            {
                txHash: "0x5432109876543210987654321098765432109876",
                toAddress: "0xefgh...5678",
                amount: 150000000,
                timestamp: Date.now() - 86400000 * 10,
                blockNumber: 18445000,
                purpose: "Thuê nhân công khảo sát"
            }
        ];
    }

    async loadUpdates() {
        this.updates = [
            {
                id: 1,
                title: "Bắt đầu xây dựng móng",
                content: "Đã bắt đầu thi công xây dựng móng cho trường học. Ước tính hoàn thành trong 2 tuần.",
                timestamp: Date.now() - 86400000 * 2,
                images: [
                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=150&fit=crop&auto=format&q=80", 
                    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=150&fit=crop&auto=format&q=80"
                ],
                type: "construction"
            },
            {
                id: 2,
                title: "Đạt 80% mục tiêu",
                content: "Chúng tôi đã đạt được 80% số tiền cần thiết! Cảm ơn sự ủng hộ của tất cả mọi người.",
                timestamp: Date.now() - 86400000 * 7,
                images: [],
                type: "milestone"
            },
            {
                id: 3,
                title: "Khảo sát địa điểm",
                content: "Đã hoàn thành khảo sát địa điểm xây dựng và lập kế hoạch chi tiết.",
                timestamp: Date.now() - 86400000 * 21,
                images: ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=150&fit=crop&auto=format&q=80"],
                type: "planning"
            }
        ];
    }

    setupEventListeners() {
        // Donation amount buttons
        document.querySelectorAll('input[name="donationAmount"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('customAmount').value = '';
            });
        });

        // Custom amount input
        const customAmount = document.getElementById('customAmount');
        if (customAmount) {
            customAmount.addEventListener('input', () => {
                document.querySelectorAll('input[name="donationAmount"]').forEach(radio => {
                    radio.checked = false;
                });
            });
        }

        // Like button
        const likeBtn = document.getElementById('likeBtn');
        if (likeBtn) {
            likeBtn.addEventListener('click', this.toggleLike.bind(this));
        }

        // Statement type selector
        document.querySelectorAll('input[name="statementType"]').forEach(radio => {
            radio.addEventListener('change', this.switchStatementType.bind(this));
        });
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('#campaignTabs button[data-bs-toggle="pill"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target').replace('#', '');
                this.currentTab = target;
                this.loadTabContent(target);
            });
        });

        // Load initial tab content
        this.loadTabContent('supporters');
    }

    loadTabContent(tabName) {
        switch (tabName) {
            case 'supporters':
                this.renderSupporters();
                break;
            case 'statements':
                this.renderStatements();
                break;
            case 'comments':
                this.renderComments();
                break;
            case 'updates':
                this.renderUpdates();
                break;
        }
    }

    renderSupporters() {
        const container = document.getElementById('supportersTable');
        if (!container) return;

        const supportersHTML = this.supporters.slice(0, 20).map(supporter => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 12px;">
                            ${supporter.isAnonymous ? '?' : supporter.address.substr(2, 2).toUpperCase()}
                        </div>
                        <span class="${supporter.isAnonymous ? 'text-muted' : ''}">${supporter.isAnonymous ? 'Người ủng hộ ẩn danh' : supporter.address}</span>
                    </div>
                </td>
                <td class="fw-bold text-primary">${this.formatCurrency(supporter.amount)}</td>
                <td class="text-muted">${this.formatDate(supporter.timestamp)}</td>
                <td>
                    <a href="https://etherscan.io/tx/${supporter.txHash}" target="_blank" class="text-decoration-none">
                        ${supporter.txHash.substring(0, 10)}...
                        <i class="fas fa-external-link-alt ms-1"></i>
                    </a>
                </td>
                <td class="text-muted">${supporter.message || '-'}</td>
            </tr>
        `).join('');

        container.innerHTML = supportersHTML;
    }

    renderStatements() {
        this.renderIncomeStatements();
        this.renderExpenseStatements();
        this.updateStatementSummary();
    }

    renderIncomeStatements() {
        const container = document.getElementById('incomeStatementsTable');
        if (!container) return;

        const html = this.incomeStatements.map(statement => `
            <tr>
                <td>
                    <a href="https://etherscan.io/tx/${statement.txHash}" target="_blank" class="text-decoration-none">
                        ${statement.txHash.substring(0, 15)}...
                        <i class="fas fa-external-link-alt ms-1"></i>
                    </a>
                </td>
                <td class="font-monospace">${statement.fromAddress}</td>
                <td class="fw-bold text-success">${this.formatCurrency(statement.amount)}</td>
                <td class="text-muted">${this.formatDate(statement.timestamp)}</td>
                <td class="text-muted">${statement.blockNumber.toLocaleString()}</td>
                <td>
                    <span class="badge bg-success">
                        <i class="fas fa-check-circle me-1"></i>Thành công
                    </span>
                </td>
            </tr>
        `).join('');

        container.innerHTML = html;
    }

    renderExpenseStatements() {
        const container = document.getElementById('expenseStatementsTable');
        if (!container) return;

        const html = this.expenseStatements.map(statement => `
            <tr>
                <td>
                    <a href="https://etherscan.io/tx/${statement.txHash}" target="_blank" class="text-decoration-none">
                        ${statement.txHash.substring(0, 15)}...
                        <i class="fas fa-external-link-alt ms-1"></i>
                    </a>
                </td>
                <td class="font-monospace">${statement.toAddress}</td>
                <td class="fw-bold text-warning">${this.formatCurrency(statement.amount)}</td>
                <td class="text-muted">${this.formatDate(statement.timestamp)}</td>
                <td class="text-muted">${statement.blockNumber.toLocaleString()}</td>
                <td class="text-muted">${statement.purpose}</td>
            </tr>
        `).join('');

        container.innerHTML = html;
    }

    updateStatementSummary() {
        const totalIncome = this.incomeStatements.reduce((sum, s) => sum + s.amount, 0);
        const totalExpense = this.expenseStatements.reduce((sum, s) => sum + s.amount, 0);

        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totalExpense);
    }

    renderComments() {
        const container = document.getElementById('commentsList');
        if (!container) return;

        const html = this.comments.map(comment => `
            <div class="comment-item ${comment.type} p-3 mb-3 rounded">
                <div class="d-flex">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        ${comment.userName.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-fill">
                        <div class="d-flex align-items-center mb-2">
                            <h6 class="fw-bold mb-0 me-2">${comment.userName}</h6>
                            <span class="badge bg-${comment.type === 'support' ? 'success' : 'info'} me-2">
                                <i class="fas fa-${comment.type === 'support' ? 'heart' : 'question-circle'} me-1"></i>
                                ${comment.type === 'support' ? 'Động viên' : 'Câu hỏi'}
                            </span>
                            <small class="text-muted">${this.formatDate(comment.timestamp)}</small>
                        </div>
                        <p class="mb-2">${comment.content}</p>
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-primary me-2">
                                <i class="far fa-heart me-1"></i>${comment.likes}
                            </button>
                            <button class="btn btn-sm btn-outline-secondary">
                                <i class="fas fa-reply me-1"></i>Trả lời
                            </button>
                        </div>
                        
                        ${comment.replies && comment.replies.length > 0 ? `
                            <div class="replies mt-3 ms-3 border-start ps-3">
                                ${comment.replies.map(reply => `
                                    <div class="reply mb-2">
                                        <div class="d-flex align-items-center mb-1">
                                            <strong class="me-2">${reply.userName}</strong>
                                            <small class="text-muted">${this.formatDate(reply.timestamp)}</small>
                                        </div>
                                        <p class="mb-1">${reply.content}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderUpdates() {
        // Updates are already rendered in HTML
    }

    switchStatementType(e) {
        const incomeContent = document.getElementById('incomeStatementContent');
        const expenseContent = document.getElementById('expenseStatementContent');
        
        if (e.target.value === 'income' || e.target.id === 'incomeStatement') {
            incomeContent.style.display = 'block';
            expenseContent.style.display = 'none';
        } else {
            incomeContent.style.display = 'none';
            expenseContent.style.display = 'block';
        }
    }

    updateUI() {
        if (!this.campaign) return;

        // Update campaign info
        document.getElementById('campaignTitle').textContent = this.campaign.title;
        document.getElementById('campaignDescription').textContent = this.campaign.description;
        
        // Update donation stats
        document.getElementById('totalRaised').textContent = this.formatCurrency(this.campaign.raisedAmount);
        document.getElementById('targetAmount').textContent = this.formatCurrency(this.campaign.targetAmount);
        document.getElementById('supportersCount').textContent = this.campaign.supporters.toLocaleString();
        document.getElementById('daysLeft').textContent = this.campaign.daysLeft;
        document.getElementById('likeCount').textContent = this.campaign.likes.toLocaleString();
        
        const progressPercentage = Math.round((this.campaign.raisedAmount / this.campaign.targetAmount) * 100);
        document.getElementById('progressPercentage').textContent = progressPercentage + '%';
        document.getElementById('progressBar').style.width = progressPercentage + '%';

        // Update tab counts
        document.getElementById('supportersTabCount').textContent = this.supporters.length.toLocaleString();
        document.getElementById('commentsTabCount').textContent = this.comments.length.toLocaleString();
    }

    async toggleLike() {
        // Simple like toggle without wallet

        const likeBtn = document.getElementById('likeBtn');
        const heartIcon = likeBtn.querySelector('i');
        const likeCount = document.getElementById('likeCount');
        
        const isLiked = heartIcon.classList.contains('fas');
        
        if (isLiked) {
            heartIcon.classList.remove('fas');
            heartIcon.classList.add('far');
            this.campaign.likes--;
        } else {
            heartIcon.classList.remove('far');
            heartIcon.classList.add('fas');
            this.campaign.likes++;
        }
        
        likeCount.textContent = this.campaign.likes.toLocaleString();
        
        console.log(isLiked ? 'Unliked campaign' : 'Liked campaign');
    }

    formatCurrency(amount) {
        if (amount >= 1000000000) {
            return (amount / 1000000000).toFixed(1) + 'B VND';
        }
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(0) + 'M VND';
        }
        return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
    }

    formatAddress(address) {
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Global functions for donation
window.openDonationModal = async () => {
    // ✅ CHECK: Wallet must be connected before donation
    if (!window.walletConnection || !window.walletConnection.isConnected()) {
        alert('⚠️ Vui lòng kết nối ví trước khi ủng hộ!');
        
        // Scroll to top where connect button is
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Highlight connect button
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.classList.add('btn-pulse'); // Add animation class if you have it
            setTimeout(() => {
                connectBtn.classList.remove('btn-pulse');
            }, 2000);
        }
        
        return; // STOP - Don't open modal
    }
    
    const selectedAmount = document.querySelector('input[name="donationAmount"]:checked')?.value || 
                          document.getElementById('customAmount').value;
    
    if (!selectedAmount || selectedAmount < 10000) {
        alert('Vui lòng chọn số tiền ủng hộ (tối thiểu 10,000 VND)');
        return;
    }

    document.getElementById('modalDonationAmount').textContent = new Intl.NumberFormat('vi-VN').format(selectedAmount) + ' VND';
    document.getElementById('modalTotalAmount').textContent = new Intl.NumberFormat('vi-VN').format(selectedAmount) + ' VND';

    const modal = new bootstrap.Modal(document.getElementById('donationModal'));
    modal.show();
};

window.processDonation = async () => {
    const confirmCheckbox = document.getElementById('confirmDonation');
    if (!confirmCheckbox.checked) {
        alert('Vui lòng xác nhận thực hiện quyên góp');
        return;
    }

    const selectedAmount = document.querySelector('input[name="donationAmount"]:checked')?.value || 
                          document.getElementById('customAmount').value;
    
    try {
        const donateBtn = document.getElementById('confirmDonationBtn');
        donateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';
        donateBtn.disabled = true;

        // Simulate donation process
        await new Promise(resolve => setTimeout(resolve, 2000));

        alert('Quyên góp thành công! Cảm ơn sự ủng hộ của bạn.');
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('donationModal')).hide();
        
        // Update campaign stats
        setTimeout(() => {
            location.reload();
        }, 2000);

    } catch (error) {
        console.error('Donation error:', error);
        alert('Lỗi thực hiện quyên góp: ' + error.message);
    } finally {
        const donateBtn = document.getElementById('confirmDonationBtn');
        donateBtn.innerHTML = '<i class="fas fa-heart me-2"></i>Xác nhận ủng hộ';
        donateBtn.disabled = false;
    }
};

window.submitComment = async () => {
    const commentText = document.getElementById('commentText').value.trim();
    const commentType = document.querySelector('input[name="commentType"]:checked').value;
    
    if (!commentText) {
        alert('Vui lòng nhập nội dung bình luận');
        return;
    }

    try {
        // Add comment to list (mock)
        const newComment = {
            id: Date.now(),
            userAddress: 'anonymous',
            userName: 'Người dùng ẩn danh',
            content: commentText,
            type: commentType,
            timestamp: Date.now(),
            likes: 0,
            replies: []
        };

        campaignDetailPage.comments.unshift(newComment);
        campaignDetailPage.renderComments();

        // Clear form
        document.getElementById('commentText').value = '';
        document.getElementById('commentSupport').checked = true;

        alert('Đã gửi bình luận thành công!');

    } catch (error) {
        console.error('Comment error:', error);
        alert('Lỗi gửi bình luận: ' + error.message);
    }
};

window.loadMoreComments = () => {
    web3Connection.showNotification('Đã tải tất cả bình luận', 'info');
};

window.submitReport = () => {
    const reportForm = document.getElementById('reportForm');
    const formData = new FormData(reportForm);
    
    if (!formData.get('reportReason')) {
        web3Connection.showNotification('Vui lòng chọn lý do báo cáo', 'warning');
        return;
    }

    // Close modal and show success
    bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
    web3Connection.showNotification('Đã gửi báo cáo. Chúng tôi sẽ xem xét và phản hồi sớm nhất.', 'success');
};

window.shareCampaign = () => {
    if (navigator.share) {
        navigator.share({
            title: campaignDetailPage.campaign.title,
            text: campaignDetailPage.campaign.description,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        web3Connection.showNotification('Đã sao chép link chiến dịch', 'success');
    }
};

// Initialize campaign detail page
let campaignDetailPage;
document.addEventListener('DOMContentLoaded', () => {
    campaignDetailPage = new CampaignDetailPage();
});
