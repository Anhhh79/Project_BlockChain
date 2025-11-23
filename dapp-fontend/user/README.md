# QuyTuThien - User Frontend Guide

## Tổng quan
Giao diện người dùng cho nền tảng quyên góp từ thiện blockchain. Được xây dựng với HTML, CSS, JavaScript và tích hợp với Ethereum Smart Contract thông qua ethers.js.

## Cấu trúc thư mục
```
user/
├── index.html              # Trang chủ
├── campaigns.html          # Danh sách chiến dịch
├── campaign-detail.html    # Chi tiết chiến dịch
├── my-donations.html       # Lịch sử quyên góp
├── about.html             # Giới thiệu
├── charityAbi.json        # ABI của smart contract
├── css/
│   └── style.css          # Custom CSS
└── js/
    ├── smart-contract.js  # Kết nối smart contract
    ├── wallet-connect.js  # Quản lý ví
    ├── main.js           # Trang chủ
    ├── campaigns.js      # Trang danh sách
    ├── campaign-detail.js # Trang chi tiết
    └── my-donations.js   # Trang lịch sử
```

## Cài đặt & Chạy

### 1. Cập nhật địa chỉ Smart Contract
Mở file `js/smart-contract.js` và cập nhật địa chỉ contract:
```javascript
this.contractAddress = 'YOUR_CONTRACT_ADDRESS_HERE';
```

### 2. Chạy ứng dụng
Sử dụng một trong các cách sau:

#### Cách 1: Live Server (VS Code)
```bash
# Cài đặt extension Live Server trong VS Code
# Click chuột phải vào index.html -> Open with Live Server
```

#### Cách 2: Python HTTP Server
```bash
cd user
python -m http.server 8000
# Truy cập: http://localhost:8000
```

#### Cách 3: Node.js HTTP Server
```bash
npm install -g http-server
cd user
http-server -p 8000
# Truy cập: http://localhost:8000
```

### 3. Kết nối MetaMask
- Cài đặt MetaMask extension: https://metamask.io/
- Tạo hoặc import ví
- Chuyển sang mạng phù hợp (Localhost, Testnet, hoặc Mainnet)
- Click "Kết nối ví" trên website

## Chức năng chính

### 1. Trang chủ (index.html)
- Hiển thị thống kê tổng quan
- Danh sách chiến dịch nổi bật
- Giới thiệu về nền tảng
- **JavaScript**: `js/main.js`

#### Chức năng:
- ✅ Load chiến dịch từ blockchain
- ✅ Hiển thị thống kê (tổng chiến dịch, số tiền, người ủng hộ)
- ✅ Thích/Bỏ thích chiến dịch
- ✅ Cập nhật real-time khi có thay đổi

### 2. Danh sách chiến dịch (campaigns.html)
- Xem tất cả chiến dịch
- Tìm kiếm và lọc chiến dịch
- Sắp xếp theo nhiều tiêu chí
- Phân trang
- **JavaScript**: `js/campaigns.js`

#### Chức năng:
- ✅ Tìm kiếm theo từ khóa
- ✅ Lọc theo khu vực
- ✅ Lọc theo danh mục
- ✅ Sắp xếp (Mới nhất, Cấp bách, Nhiều quyên góp, Sắp kết thúc)
- ✅ Phân trang với điều hướng
- ✅ Like/Unlike chiến dịch

### 3. Chi tiết chiến dịch (campaign-detail.html)
- Xem thông tin chi tiết
- Quyên góp cho chiến dịch
- Xem danh sách người ủng hộ
- Bình luận và thảo luận
- Theo dõi cập nhật
- **JavaScript**: `js/campaign-detail.js`

#### Chức năng:
- ✅ Hiển thị đầy đủ thông tin chiến dịch
- ✅ Quyên góp với số tiền tùy chỉnh
- ✅ Quyên góp ẩn danh
- ✅ Gửi lời nhắn kèm quyên góp
- ✅ Xem danh sách người ủng hộ với transaction hash
- ✅ Bình luận (động viên hoặc câu hỏi)
- ✅ Like/Unlike chiến dịch
- ✅ Chia sẻ chiến dịch
- ✅ Báo cáo chiến dịch (nếu phát hiện vấn đề)

#### Flow quyên góp:
1. Người dùng nhập số tiền (VND)
2. Hệ thống chuyển đổi sang ETH
3. Hiển thị modal xác nhận
4. User check "Tôi xác nhận thực hiện quyên góp này"
5. Click "Xác nhận ủng hộ"
6. MetaMask hiện popup xác nhận giao dịch
7. User xác nhận trong MetaMask
8. Chờ transaction được xác nhận
9. Hiển thị thông báo thành công
10. Tự động reload để cập nhật dữ liệu

### 4. Lịch sử quyên góp (my-donations.html)
- Xem tất cả quyên góp của bạn
- Thống kê tổng quan
- Chi tiết từng giao dịch
- Link đến Etherscan
- **JavaScript**: `js/my-donations.js`

#### Chức năng:
- ✅ Hiển thị tất cả quyên góp của user
- ✅ Thống kê: Tổng tiền, Số lần, Số chiến dịch, Điểm tác động
- ✅ Chi tiết mỗi quyên góp (số tiền, thời gian, block, tx hash)
- ✅ Copy transaction hash
- ✅ Link đến campaign detail
- ✅ Link đến Etherscan explorer
- ✅ Xác thực blockchain

## Kết nối Smart Contract

### Các hàm chính trong smart-contract.js:

#### Campaign Functions
```javascript
// Lấy tất cả chiến dịch
await smartContract.getAllCampaigns()

// Lấy chi tiết 1 chiến dịch
await smartContract.getCampaign(campaignId)

// Lấy số người ủng hộ
await smartContract.getSupportersCount(campaignId)
```

#### Donation Functions
```javascript
// Quyên góp
await smartContract.donate(campaignId, amountInEther)

// Lấy danh sách donations
await smartContract.getDonations(campaignId)

// Lấy donations của user
await smartContract.getUserDonations(userAddress)
```

#### Comment Functions
```javascript
// Thêm bình luận
await smartContract.addComment(campaignId, text, isAnonymous)

// Lấy danh sách bình luận
await smartContract.getComments(campaignId)
```

#### Like Functions
```javascript
// Like chiến dịch
await smartContract.like(campaignId)

// Unlike chiến dịch
await smartContract.unlike(campaignId)

// Kiểm tra đã like chưa
await smartContract.isLiked(campaignId, address)

// Lấy số lượng likes
await smartContract.getLikesCount(campaignId)
```

## Wallet Connection

### Các hàm trong wallet-connect.js:

```javascript
// Kết nối ví
await walletConnection.connect()

// Ngắt kết nối
walletConnection.disconnect()

// Lấy thông tin
walletConnection.getAccount()
walletConnection.getBalance()
walletConnection.getChainId()
walletConnection.getProvider()
walletConnection.getSigner()
```

### Events:
```javascript
// Lắng nghe sự kiện kết nối ví
window.addEventListener('walletConnected', (event) => {
    console.log('Account:', event.detail.account);
    console.log('Balance:', event.detail.balance);
});

// Lắng nghe thay đổi tài khoản
window.addEventListener('accountChanged', (event) => {
    console.log('New account:', event.detail.account);
});

// Lắng nghe ngắt kết nối
window.addEventListener('walletDisconnected', () => {
    console.log('Wallet disconnected');
});
```

## Cấu hình mạng

### Localhost (Hardhat)
```javascript
Network Name: Localhost 8545
RPC URL: http://localhost:8545
Chain ID: 31337
Currency Symbol: ETH
```

### Sepolia Testnet
```javascript
Network Name: Sepolia
RPC URL: https://sepolia.infura.io/v3/YOUR-PROJECT-ID
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

## Xử lý lỗi

### Các lỗi thường gặp:

1. **User rejected transaction**
   - Người dùng từ chối trong MetaMask
   - Giải pháp: Thử lại

2. **Insufficient funds**
   - Không đủ ETH trong ví
   - Giải pháp: Nạp thêm ETH

3. **Gas price too high**
   - Phí gas cao
   - Giải pháp: Chờ hoặc tăng gas limit

4. **Contract not found**
   - Địa chỉ contract sai hoặc chưa deploy
   - Giải pháp: Kiểm tra lại địa chỉ

5. **Wrong network**
   - Kết nối sai mạng
   - Giải pháp: Chuyển sang đúng mạng

## Best Practices

### 1. Security
- ✅ Không lưu private key trong code
- ✅ Validate input trước khi gửi transaction
- ✅ Hiển thị xác nhận trước khi thực hiện action quan trọng
- ✅ Xử lý lỗi đầy đủ

### 2. Performance
- ✅ Cache dữ liệu khi có thể
- ✅ Debounce search input
- ✅ Lazy load images
- ✅ Pagination cho danh sách dài

### 3. UX
- ✅ Loading states rõ ràng
- ✅ Error messages dễ hiểu
- ✅ Success feedback
- ✅ Responsive design
- ✅ Keyboard navigation

## Testing

### Manual Testing Checklist:

#### Wallet Connection
- [ ] Kết nối MetaMask thành công
- [ ] Hiển thị địa chỉ và balance
- [ ] Ngắt kết nối hoạt động
- [ ] Chuyển tài khoản cập nhật đúng

#### Campaigns
- [ ] Load danh sách chiến dịch
- [ ] Tìm kiếm hoạt động
- [ ] Lọc theo region/category
- [ ] Sắp xếp đúng
- [ ] Phân trang chính xác
- [ ] Like/Unlike campaign

#### Donation
- [ ] Nhập số tiền và xem preview
- [ ] Gửi transaction thành công
- [ ] Hiển thị trong My Donations
- [ ] Transaction hash đúng
- [ ] Balance cập nhật

#### Comments
- [ ] Thêm comment thành công
- [ ] Hiển thị danh sách comments
- [ ] Ẩn danh hoạt động

## Troubleshooting

### Q: MetaMask không popup?
A: 
- Kiểm tra MetaMask extension đã cài
- Refresh trang
- Kiểm tra popup blocker

### Q: Transaction failed?
A: 
- Kiểm tra balance đủ cho gas
- Kiểm tra đúng mạng
- Xem chi tiết lỗi trong console

### Q: Dữ liệu không load?
A:
- Kiểm tra contract address đúng
- Kiểm tra ABI file
- Mở console xem lỗi
- Kiểm tra kết nối mạng

### Q: Số liệu không cập nhật?
A:
- Refresh trang
- Đợi transaction confirm
- Clear cache

## Support

Nếu gặp vấn đề:
1. Kiểm tra Console trong Browser DevTools
2. Kiểm tra Network tab
3. Kiểm tra MetaMask logs
4. Đọc error message kỹ

## License
MIT
