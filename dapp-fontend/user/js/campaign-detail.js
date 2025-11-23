// Campaign Detail Page JavaScript
let currentCampaign = null;
let campaignId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Get campaign ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    campaignId = parseInt(urlParams.get('id'));
    
    if (!campaignId) {
        showAlert('ID chiến dịch không hợp lệ', 'danger');
        setTimeout(() => {
            window.location.href = 'campaigns.html';
        }, 2000);
        return;
    }
    
    await loadCampaignDetail();
    
    // Listen for wallet connection
    window.addEventListener('walletConnected', () => {
        loadCampaignDetail();
    });
    
    // Initialize donation amount buttons
    initializeDonationForm();
});

async function loadCampaignDetail() {
    try {
        // Initialize contract if not already initialized
        if (!window.smartContract.contract) {
            // Check if wallet is connected
            if (window.walletConnection && window.walletConnection.isConnected) {
                const provider = window.walletConnection.getProvider();
                const signer = window.walletConnection.getSigner();
                await window.smartContract.initialize(provider, signer);
            } else {
                // Use read-only provider (without signer)
                const provider = new ethers.providers.JsonRpcProvider('https://evmtestnet.confluxrpc.com');
                await window.smartContract.initialize(provider, provider);
            }
        }
        
        currentCampaign = await window.smartContract.getCampaign(campaignId);
        
        if (!currentCampaign || currentCampaign.id === 0) {
            showAlert('Không tìm thấy chiến dịch', 'danger');
            setTimeout(() => {
                window.location.href = 'campaigns.html';
            }, 2000);
            return;
        }
        
        // Render campaign info
        await renderCampaignInfo();
        
        // Load tabs content
        await loadSupporters();
        await loadComments();
        await loadDisbursements();
        await loadDisbursements();
        
    } catch (error) {
        console.error('Error loading campaign:', error);
        showAlert('Lỗi khi tải dữ liệu chiến dịch: ' + error.message, 'danger');
    }
}

async function renderCampaignInfo() {
    // Update title and description
    document.getElementById('campaignTitle').textContent = currentCampaign.title;
    document.getElementById('campaignDescription').textContent = currentCampaign.description;
    
    // Update campaign images from blockchain
    updateCampaignImages();
    
    // Update stats - Convert ETH to VND for display
    const ethToVnd = 50000000; // 1 ETH = 50,000,000 VND
    const raisedVnd = (parseFloat(currentCampaign.collectedEth) * ethToVnd).toLocaleString('vi-VN');
    const targetVnd = (parseFloat(currentCampaign.targetEth) * ethToVnd).toLocaleString('vi-VN');
    
    document.getElementById('totalRaised').textContent = raisedVnd + ' VND';
    document.getElementById('targetAmount').textContent = targetVnd + ' VND';
    document.getElementById('progressPercentage').textContent = currentCampaign.progress + '%';
    document.getElementById('progressBar').style.width = currentCampaign.progress + '%';
    
    const supportersCount = await window.smartContract.getSupportersCount(campaignId);
    document.getElementById('supportersCount').textContent = supportersCount;
    document.getElementById('supportersTabCount').textContent = supportersCount;
    
    // Update location and days left from blockchain data
    document.getElementById('campaignLocation').textContent = currentCampaign.location || 'Chưa xác định';
    document.getElementById('campaignTimeLeft').textContent = currentCampaign.active ? 
        (currentCampaign.daysLeft > 0 ? `Còn ${currentCampaign.daysLeft} ngày` : 'Sắp kết thúc') : 
        'Đã kết thúc';
    
    document.getElementById('daysLeft').textContent = currentCampaign.daysLeft;
    
    // Update like button
    const likesCount = await window.smartContract.getLikesCount(campaignId);
    document.getElementById('likeCount').textContent = likesCount;
    
    const likeBtn = document.getElementById('likeBtn');
    likeBtn.addEventListener('click', handleLike);
    
    if (window.walletConnection && window.walletConnection.isConnected) {
        const isLiked = await window.smartContract.isLiked(campaignId, window.walletConnection.account);
        if (isLiked) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('i').classList.remove('far');
            likeBtn.querySelector('i').classList.add('fas');
        }
    }
}

function initializeDonationForm() {
    // Amount buttons
    const amountButtons = document.querySelectorAll('input[name="donationAmount"]');
    amountButtons.forEach(btn => {
        btn.addEventListener('change', (e) => {
            document.getElementById('customAmount').value = '';
        });
    });
    
    // Custom amount input
    const customAmount = document.getElementById('customAmount');
    customAmount.addEventListener('input', () => {
        amountButtons.forEach(btn => btn.checked = false);
    });
    
    // Donate button
    const donateBtn = document.getElementById('donateBtn');
    if (donateBtn) {
        donateBtn.addEventListener('click', openDonationModal);
    }
}

async function openDonationModal() {
    if (!window.walletConnection || !window.walletConnection.isConnected) {
        showAlert('Vui lòng kết nối ví để quyên góp', 'warning');
        return;
    }
    
    // Get donation amount
    const selectedAmount = document.querySelector('input[name="donationAmount"]:checked');
    const customAmount = document.getElementById('customAmount').value;
    
    let amount = 0;
    if (customAmount) {
        amount = parseFloat(customAmount);
    } else if (selectedAmount) {
        amount = parseFloat(selectedAmount.value);
    }
    
    if (!amount || amount <= 0) {
        showAlert('Vui lòng nhập số tiền quyên góp', 'warning');
        return;
    }
    
    // Convert VND to ETH (mock rate: 1 ETH = 50,000,000 VND)
    const ethAmount = amount / 50000000;
    
    // Update modal
    document.getElementById('modalDonationAmount').textContent = amount.toLocaleString('vi-VN') + ' VND (' + ethAmount.toFixed(6) + ' ETH)';
    document.getElementById('modalTotalAmount').textContent = amount.toLocaleString('vi-VN') + ' VND (' + ethAmount.toFixed(6) + ' ETH)';
    
    // Store amount for later
    document.getElementById('confirmDonationBtn').dataset.amount = ethAmount;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('donationModal'));
    modal.show();
}

async function processDonation() {
    const confirmCheckbox = document.getElementById('confirmDonation');
    if (!confirmCheckbox.checked) {
        showAlert('Vui lòng xác nhận quyên góp', 'warning');
        return;
    }
    
    const amount = parseFloat(document.getElementById('confirmDonationBtn').dataset.amount);
    const isAnonymous = document.getElementById('anonymousDonation').checked;
    const message = document.getElementById('donationMessage').value;
    
    try {
        // Disable button
        const btn = document.getElementById('confirmDonationBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...';
        
        // Make donation
        const result = await window.smartContract.donate(campaignId, amount);
        
        if (result.success) {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('donationModal'));
            modal.hide();
            
            // Show success
            showAlert('Quyên góp thành công! Cảm ơn bạn đã đóng góp.', 'success');
            
            // Add comment if there's a message
            if (message) {
                await window.smartContract.addComment(campaignId, message, isAnonymous);
            }
            
            // Reload page
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showAlert('Lỗi: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Donation error:', error);
        showAlert('Lỗi khi quyên góp: ' + error.message, 'danger');
    } finally {
        const btn = document.getElementById('confirmDonationBtn');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-heart me-2"></i>Xác nhận ủng hộ';
    }
}

async function loadSupporters() {
    const table = document.getElementById('supportersTable');
    if (!table) return;
    
    try {
        const donations = await window.smartContract.getDonations(campaignId);
        
        if (donations.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <i class="fas fa-inbox fa-2x text-muted mb-2 d-block"></i>
                        <span class="text-muted">Chưa có người ủng hộ</span>
                    </td>
                </tr>
            `;
            return;
        }
        
        // Sort by timestamp descending
        donations.sort((a, b) => b.timestamp - a.timestamp);
        
        table.innerHTML = '';
        for (const donation of donations) {
            // Convert ETH to VND for display
            const ethToVnd = 50000000; // 1 ETH = 50,000,000 VND
            const donationVnd = (parseFloat(donation.amountEth) * ethToVnd).toLocaleString('vi-VN');
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                            <i class="fas fa-user text-primary"></i>
                        </div>
                        <span class="font-monospace small">${window.smartContract.formatAddress(donation.donor)}</span>
                    </div>
                </td>
                <td><strong class="text-primary">${donationVnd} VND</strong></td>
                <td><small>${window.smartContract.formatTimestamp(donation.timestamp)}</small></td>
                <td>
                    <a href="https://evmtestnet.confluxscan.io/tx/${donation.txHash}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </td>
            `;
            table.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading supporters:', error);
    }
}

async function loadComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    try {
        const comments = await window.smartContract.getComments(campaignId);
        
        const commentsCountEl = document.getElementById('commentsTabCount');
        if (commentsCountEl) {
            commentsCountEl.textContent = comments.length;
        }
        
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Chưa có bình luận nào</p>
                    <p class="text-muted small">Hãy là người đầu tiên bình luận!</p>
                </div>
            `;
            return;
        }
        
        // Sort by timestamp descending
        comments.sort((a, b) => b.timestamp - a.timestamp);
        
        commentsList.innerHTML = '';
        for (const comment of comments) {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item border-bottom pb-3 mb-3';
            
            const commenterDisplay = comment.isAnonymous ? 
                'Ẩn danh' : 
                window.smartContract.formatAddress(comment.commenter);
            
            commentDiv.innerHTML = `
                <div class="d-flex mb-2">
                    <div class="flex-shrink-0">
                        <div class="bg-primary bg-opacity-10 rounded-circle p-2">
                            <i class="fas fa-user text-primary"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="mb-1">${commenterDisplay}</h6>
                            <small class="text-muted">${window.smartContract.formatTimestamp(comment.timestamp)}</small>
                        </div>
                        <p class="mb-0">${comment.text}</p>
                    </div>
                </div>
            `;
            
            commentsList.appendChild(commentDiv);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

async function submitComment() {
    const commentText = document.getElementById('commentText').value.trim();
    
    if (!commentText) {
        showAlert('Vui lòng nhập nội dung bình luận', 'warning');
        return;
    }
    
    if (!window.walletConnection || !window.walletConnection.isConnected) {
        showAlert('Vui lòng kết nối ví để bình luận', 'warning');
        return;
    }
    
    try {
        const commentType = document.querySelector('input[name="commentType"]:checked').value;
        const isQuestion = commentType === 'question';
        
        const result = await window.smartContract.addComment(campaignId, commentText, false);
        
        if (result.success) {
            showAlert('Đã gửi bình luận', 'success');
            document.getElementById('commentText').value = '';
            
            // Reload comments
            await loadComments();
        } else {
            showAlert('Lỗi: ' + result.error, 'danger');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        showAlert('Lỗi khi gửi bình luận', 'danger');
    }
}

async function handleLike() {
    if (!window.walletConnection || !window.walletConnection.isConnected) {
        showAlert('Vui lòng kết nối ví để thích chiến dịch', 'warning');
        return;
    }
    
    const btn = document.getElementById('likeBtn');
    const isLiked = btn.classList.contains('liked');
    
    try {
        btn.disabled = true;
        
        if (isLiked) {
            const result = await window.smartContract.unlike(campaignId);
            if (result.success) {
                btn.classList.remove('liked');
                btn.querySelector('i').classList.remove('fas');
                btn.querySelector('i').classList.add('far');
                
                const count = parseInt(document.getElementById('likeCount').textContent);
                document.getElementById('likeCount').textContent = count - 1;
            }
        } else {
            const result = await window.smartContract.like(campaignId);
            if (result.success) {
                btn.classList.add('liked');
                btn.querySelector('i').classList.remove('far');
                btn.querySelector('i').classList.add('fas');
                
                const count = parseInt(document.getElementById('likeCount').textContent);
                document.getElementById('likeCount').textContent = count + 1;
            }
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        showAlert('Lỗi: ' + error.message, 'danger');
    } finally {
        btn.disabled = false;
    }
}

function shareCampaign() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: currentCampaign.title,
            text: currentCampaign.description,
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showAlert('Đã sao chép liên kết', 'success');
        }).catch(err => {
            console.error('Error copying:', err);
        });
    }
}

function submitReport() {
    const form = document.getElementById('reportForm');
    const reason = form.querySelector('input[name="reportReason"]:checked');
    const description = form.querySelector('textarea[name="reportDescription"]').value;
    
    if (!reason) {
        showAlert('Vui lòng chọn lý do báo cáo', 'warning');
        return;
    }
    
    // In real app, send to backend
    console.log('Report submitted:', {
        campaignId: campaignId,
        reason: reason.value,
        description: description
    });
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
    modal.hide();
    
    showAlert('Đã gửi báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.', 'success');
}

function loadMoreComments() {
    // Implement pagination for comments if needed
    showAlert('Đã hiển thị tất cả bình luận', 'info');
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

function updateCampaignImages() {
    if (!currentCampaign || !currentCampaign.media) {
        console.warn('No media found for campaign');
        return;
    }
    
    // Parse media URLs from blockchain (expecting comma-separated URLs or single URL)
    let imageUrls = [];
    
    if (currentCampaign.media.trim()) {
        // Split by comma if multiple URLs, otherwise use single URL
        imageUrls = currentCampaign.media.split(',').map(url => url.trim()).filter(url => url);
        
        // If no valid URLs found, use a default fallback
        if (imageUrls.length === 0) {
            imageUrls = ['https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&h=400&fit=crop&auto=format&q=80'];
        }
    } else {
        // Use default image if no media URL from blockchain
        imageUrls = ['https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&h=400&fit=crop&auto=format&q=80'];
    }
    
    // Update carousel indicators
    const indicators = document.querySelector('#campaignCarousel .carousel-indicators');
    if (indicators) {
        indicators.innerHTML = '';
        imageUrls.forEach((_, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-bs-target', '#campaignCarousel');
            button.setAttribute('data-bs-slide-to', index.toString());
            if (index === 0) {
                button.classList.add('active');
                button.setAttribute('aria-current', 'true');
            }
            button.setAttribute('aria-label', `Slide ${index + 1}`);
            indicators.appendChild(button);
        });
    }
    
    // Update carousel items
    const carouselInner = document.querySelector('#campaignCarousel .carousel-inner');
    if (carouselInner) {
        carouselInner.innerHTML = '';
        imageUrls.forEach((imageUrl, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = 'carousel-item' + (index === 0 ? ' active' : '');
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'd-block w-100';
            img.alt = `${currentCampaign.title} - Hình ${index + 1}`;
            img.style.cssText = 'height: 400px; object-fit: cover; cursor: pointer;';
            
            // Add click event to open modal for full-size image
            img.addEventListener('click', () => {
                const modal = document.getElementById('imageModal');
                const modalImage = document.getElementById('modalImage');
                if (modal && modalImage) {
                    modalImage.src = imageUrl;
                    modalImage.alt = img.alt;
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                }
            });
            
            // Handle image load error
            img.addEventListener('error', () => {
                console.warn('Failed to load image:', imageUrl);
                img.src = 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&h=400&fit=crop&auto=format&q=80';
                img.alt = 'Hình ảnh mặc định';
            });
            
            carouselItem.appendChild(img);
            carouselInner.appendChild(carouselItem);
        });
        
        // Hide carousel controls if only one image
        const prevControl = document.querySelector('#campaignCarousel .carousel-control-prev');
        const nextControl = document.querySelector('#campaignCarousel .carousel-control-next');
        
        if (imageUrls.length <= 1) {
            if (prevControl) prevControl.style.display = 'none';
            if (nextControl) nextControl.style.display = 'none';
            if (indicators) indicators.style.display = 'none';
        } else {
            if (prevControl) prevControl.style.display = 'block';
            if (nextControl) nextControl.style.display = 'block';
            if (indicators) indicators.style.display = 'flex';
        }
    }
    
    console.log('Campaign images updated from blockchain:', imageUrls);
}

async function loadDisbursements() {
    try {
        const disbursements = await window.smartContract.getDisbursements(campaignId);
        displayDisbursements(disbursements);
    } catch (error) {
        console.error('Error loading disbursements:', error);
    }
}

function displayDisbursements(disbursements) {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;
    
    // Clear existing timeline items
    timeline.innerHTML = '';
    
    if (disbursements.length === 0) {
        timeline.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-info-circle fs-4 mb-3 d-block"></i>
                <p class="mb-0">Chưa có cập nhật tiến độ nào.</p>
            </div>
        `;
        return;
    }
    
    // Sort disbursements by timestamp (newest first)
    disbursements.sort((a, b) => b.timestamp - a.timestamp);
    
    disbursements.forEach((disbursement, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item mb-4';
        
        const date = new Date(disbursement.timestamp * 1000);
        const timeAgo = getTimeAgo(disbursement.timestamp);
        
        timelineItem.innerHTML = `
            <div class="timeline-marker bg-${index % 2 === 0 ? 'primary' : 'success'}"></div>
            <div class="timeline-content">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="fw-bold mb-0">Giải ngân: ${disbursement.amountEth} ETH</h6>
                    <small class="text-muted">${timeAgo}</small>
                </div>
                <p class="text-muted mb-2">
                    <strong>Người nhận:</strong> ${disbursement.recipient.substring(0, 6)}...${disbursement.recipient.substring(disbursement.recipient.length - 4)}
                </p>
                ${disbursement.note ? `<p class="text-muted mb-2">${disbursement.note}</p>` : ''}
                ${disbursement.proofImage && disbursement.proofImage.trim() ? createDisbursementImages(disbursement.proofImage) : ''}
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="fas fa-link me-1"></i>
                        <a href="https://evm.confluxscan.net/tx/${disbursement.txHash}" target="_blank" class="text-decoration-none">
                            Xem giao dịch
                        </a>
                    </small>
                </div>
            </div>
        `;
        
        timeline.appendChild(timelineItem);
    });
}

function createDisbursementImages(proofImageUrls) {
    if (!proofImageUrls || !proofImageUrls.trim()) {
        return '';
    }
    
    // Parse image URLs (comma-separated)
    const imageUrls = proofImageUrls.split(',').map(url => url.trim()).filter(url => url);
    
    if (imageUrls.length === 0) {
        return '';
    }
    
    let imagesHtml = '<div class="d-flex gap-2 flex-wrap mt-2">';
    
    imageUrls.forEach((imageUrl, index) => {
        imagesHtml += `
            <img src="${imageUrl}" 
                 alt="Hình chứng minh ${index + 1}" 
                 class="rounded disbursement-image" 
                 style="width: 120px; height: 80px; object-fit: cover; cursor: pointer;"
                 onclick="openImageModal('${imageUrl}', 'Hình chứng minh giải ngân')"
                 onerror="this.src='https://via.placeholder.com/120x80?text=Lỗi+ảnh'">
        `;
    });
    
    imagesHtml += '</div>';
    return imagesHtml;
}

function getTimeAgo(timestamp) {
    const now = Date.now() / 1000;
    const diffSeconds = now - timestamp;
    
    if (diffSeconds < 60) {
        return 'Vừa xong';
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} phút trước`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} giờ trước`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days} ngày trước`;
    }
}

function openImageModal(imageUrl, altText) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    if (modal && modalImage) {
        modalImage.src = imageUrl;
        modalImage.alt = altText || 'Hình ảnh';
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Make functions global
window.openDonationModal = openDonationModal;
window.processDonation = processDonation;
window.submitComment = submitComment;
window.shareCampaign = shareCampaign;
window.openImageModal = openImageModal;
window.submitReport = submitReport;
window.loadMoreComments = loadMoreComments;
