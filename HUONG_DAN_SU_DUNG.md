# 🚀 Hướng Dẫn Sử Dụng DApp Quyên Góp Từ Thiện

## 📋 Thông Tin Hệ Thống

### Contract đã deploy:
- **Contract Address:** `0x7fF862bAD0628e1987037294C3c4bc3d6f367471`
- **Blockchain:** Conflux eSpace Testnet
- **Chain ID:** 71
- **RPC URL:** https://evmtestnet.confluxrpc.com
- **Block Explorer:** https://evmtestnet.confluxscan.io

## 🔧 Cài Đặt Ban Đầu

### 1. Cài đặt MetaMask
- Truy cập: https://metamask.io/download/
- Cài extension cho Chrome/Firefox/Brave
- Tạo ví mới hoặc import ví hiện có

### 2. Thêm Mạng Conflux eSpace Testnet

**Cách 1: Tự động (Khuyến nghị)**
- Khi kết nối ví trên website, hệ thống sẽ tự động yêu cầu thêm mạng
- Nhấn "Approve" để thêm mạng

**Cách 2: Thêm thủ công**
1. Mở MetaMask → Settings → Networks → Add Network
2. Điền thông tin:
   - **Network Name:** Conflux eSpace Testnet
   - **RPC URL:** https://evmtestnet.confluxrpc.com
   - **Chain ID:** 71
   - **Currency Symbol:** CFX
   - **Block Explorer:** https://evmtestnet.confluxscan.io

### 3. Lấy CFX Testnet (Miễn phí)
- Truy cập: https://efaucet.confluxnetwork.org/
- Nhập địa chỉ ví MetaMask của bạn
- Nhận CFX testnet để test giao dịch

## 🎯 Sử Dụng Giao Diện User

### Khởi chạy website:
```bash
cd dapp-fontend/user
python -m http.server 8000
```
Truy cập: http://localhost:8000

### Các chức năng:

#### 1. Xem Danh Sách Chiến Dịch
- Trang chủ hiển thị các chiến dịch nổi bật
- Xem tất cả: `/campaigns.html`
- Tìm kiếm, lọc theo trạng thái, sắp xếp

#### 2. Xem Chi Tiết Chiến Dịch
- Click vào chiến dịch
- Xem mô tả đầy đủ, số tiền đã quyên góp, danh sách người ủng hộ
- Xem bình luận

#### 3. Quyên Góp
- **Bước 1:** Kết nối ví MetaMask (nút "Connect Wallet")
- **Bước 2:** Chọn chiến dịch muốn quyên góp
- **Bước 3:** Nhập số tiền CFX
- **Bước 4:** Xác nhận giao dịch trên MetaMask
- **Kết quả:** Nhận transaction hash, có thể xem trên Block Explorer

#### 4. Like/Unlike Chiến Dịch
- Yêu cầu: Đã kết nối ví
- Click icon ❤️ để like/unlike

#### 5. Bình Luận
- Yêu cầu: Đã kết nối ví
- Nhập nội dung bình luận
- Submit → Xác nhận giao dịch trên MetaMask

#### 6. Xem Lịch Sử Quyên Góp
- Truy cập: `/my-donations.html`
- Xem tất cả các lần quyên góp của bạn
- Thống kê tổng số tiền, số chiến dịch đã ủng hộ

## 🔐 Sử Dụng Giao Diện Admin

### Khởi chạy:
```bash
cd dapp-fontend/admin
python -m http.server 8001
```
Truy cập: http://localhost:8001/Admin.html

### Các chức năng Admin:

#### 1. Tạo Chiến Dịch Mới
- **Bước 1:** Kết nối ví admin
- **Bước 2:** Điền form:
  - Tên chiến dịch
  - Mô tả chi tiết
  - Số tiền mục tiêu (CFX)
  - Thời gian kết thúc
  - URL hình ảnh
  - Thông tin người thụ hưởng
- **Bước 3:** Submit → Xác nhận giao dịch
- **Phí gas:** ~0.002-0.005 CFX

#### 2. Chỉnh Sửa Chiến Dịch
- Click icon ✏️ ở chiến dịch cần sửa
- Sửa thông tin (có thể sửa mọi trường trừ ID)
- Submit → Xác nhận giao dịch

#### 3. Xóa Chiến Dịch
- Click icon 🗑️
- Xác nhận xóa
- Submit → Xác nhận giao dịch
- **Lưu ý:** Chỉ xóa được chiến dịch chưa có người quyên góp

#### 4. Rút Tiền
- Chọn chiến dịch đã đạt hoặc vượt mục tiêu
- Click "Rút Tiền"
- Xác nhận → Tiền sẽ chuyển đến địa chỉ người thụ hưởng
- **Điều kiện:** Chiến dịch đã hết hạn hoặc đạt mục tiêu

#### 5. Quản Lý Bình Luận
- Xem tất cả bình luận của chiến dịch
- Xóa bình luận không phù hợp

## 💡 Lưu Ý Quan Trọng

### Về Transaction:
- ✅ Mỗi hành động (tạo chiến dịch, quyên góp, bình luận) đều tạo transaction
- ✅ Phải xác nhận transaction trên MetaMask
- ✅ Đợi transaction được confirm (vài giây)
- ✅ Có thể xem transaction trên Block Explorer

### Về Phí Gas:
- 💰 Mỗi transaction tốn phí gas (rất nhỏ trên testnet)
- 💰 Đảm bảo có đủ CFX trong ví
- 💰 Phí gas thay đổi tùy network congestion

### Về Dữ Liệu:
- 🔒 Tất cả dữ liệu lưu trên blockchain (minh bạch, không thể sửa đổi)
- 🔒 Không thể xóa dữ liệu đã lưu (chỉ có thể đánh dấu xóa)
- 🔒 Ai cũng có thể xem dữ liệu (public)

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi: "User rejected the request"
- **Nguyên nhân:** Bạn đã từ chối giao dịch trên MetaMask
- **Giải pháp:** Thử lại và nhấn "Confirm"

### Lỗi: "Insufficient funds"
- **Nguyên nhân:** Không đủ CFX trong ví
- **Giải pháp:** Lấy thêm CFX từ faucet

### Lỗi: "Transaction failed"
- **Nguyên nhân:** 
  - Không đủ gas
  - Vi phạm điều kiện contract (ví dụ: rút tiền khi chưa đạt mục tiêu)
- **Giải pháp:** Kiểm tra điều kiện và thử lại

### Lỗi: "Wrong network"
- **Nguyên nhân:** MetaMask đang ở mạng khác
- **Giải pháp:** Chuyển sang Conflux eSpace Testnet

### Trang không load campaigns:
- **Nguyên nhân:** Contract chưa có dữ liệu
- **Giải pháp:** Dùng tài khoản admin tạo vài chiến dịch mẫu

## 📊 Thống Kê & Báo Cáo

### Xem trên Block Explorer:
1. Copy contract address: `0x7fF862bAD0628e1987037294C3c4bc3d6f367471`
2. Truy cập: https://evmtestnet.confluxscan.io
3. Dán vào ô search
4. Xem:
   - Số transaction
   - Balance
   - Contract code
   - Events

## 🎓 Demo Flow Hoàn Chỉnh

### Scenario 1: Người dùng quyên góp
1. Mở website user → Xem danh sách chiến dịch
2. Click vào chiến dịch quan tâm
3. Kết nối MetaMask (tự động chuyển mạng)
4. Nhập số tiền quyên góp (ví dụ: 0.01 CFX)
5. Submit → Xác nhận trên MetaMask
6. Đợi transaction confirm
7. Xem tên mình xuất hiện trong danh sách người ủng hộ
8. Like chiến dịch
9. Viết bình luận động viên

### Scenario 2: Admin tạo chiến dịch
1. Mở website admin
2. Kết nối ví admin
3. Tạo chiến dịch mới:
   - Tên: "Hỗ trợ trẻ em vùng cao"
   - Mục tiêu: 1 CFX
   - Thời gian: 30 ngày
4. Submit → Xác nhận giao dịch
5. Đợi transaction confirm
6. Chiến dịch xuất hiện trên cả user và admin
7. Chia sẻ link chiến dịch cho người dùng
8. Theo dõi số tiền quyên góp
9. Khi đạt mục tiêu → Rút tiền cho người thụ hưởng

## 🔐 Bảo Mật

- ✅ Contract đã verified trên block explorer
- ✅ Chỉ admin có thể tạo/sửa/xóa chiến dịch
- ✅ Chỉ admin có thể rút tiền
- ✅ Người dùng chỉ có thể quyên góp, bình luận, like
- ✅ Private key không bao giờ được lưu hoặc gửi đi

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console log (F12 → Console)
2. Kiểm tra transaction trên Block Explorer
3. Đảm bảo đang ở đúng mạng (Chain ID: 71)
4. Đảm bảo có đủ CFX trong ví

---

**Chúc bạn sử dụng DApp thành công! 🎉**
