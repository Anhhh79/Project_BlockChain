# 🎨 Giao Diện Mới - QuyTuThien DApp

## ✨ Những Cải Tiến Chính

### 🎯 Thiết Kế Hiện Đại
- **Color Scheme Mới**: Chuyển từ màu xanh dương truyền thống sang gradient tím-xanh hiện đại (#6366f1)
- **Typography**: Font Inter với các cấp độ weight rõ ràng, dễ đọc
- **Spacing**: Khoảng cách hợp lý hơn, thoáng hơn
- **Shadows**: Hiệu ứng đổ bóng mềm mại, tạo chiều sâu

### 🎭 Animations & Transitions
- **Fade In Animations**: Các elements xuất hiện mượt mà
- **Hover Effects**: Tất cả các nút và card đều có hiệu ứng hover
- **Stagger Animations**: Campaign cards xuất hiện lần lượt
- **Smooth Transitions**: Mọi thay đổi đều có transition 0.3s

### 🃏 Campaign Cards
- **Hover Lift**: Card nâng lên khi hover
- **Image Scale**: Ảnh phóng to nhẹ khi hover
- **Like Button**: Hiệu ứng heart beat khi like
- **Progress Bar**: Shimmer effect trên thanh tiến độ
- **Badge**: Các nhãn với gradient và backdrop blur

### 💳 Wallet Connection
- **Premium Design**: Gradient tím đẹp mắt
- **Monospace Font**: Địa chỉ wallet dễ đọc
- **Balance Display**: Hiển thị số dư rõ ràng
- **Network Indicator**: Chấm xanh nhấp nháy cho biết đang online
- **Ripple Effect**: Hiệu ứng sóng khi click nút

### 🎨 UI Components

#### Buttons
```css
.btn-primary - Gradient xanh tím với shadow
.btn-outline-primary - Border với hover effect
.btn-lg - Nút lớn cho CTA chính
.btn-sm - Nút nhỏ cho actions phụ
.hover-lift - Class utility cho hover effect
```

#### Cards
```css
.campaign-card - Card chiến dịch với đầy đủ effects
.hover-shadow-lg - Shadow lớn hơn khi hover
.rounded-3 - Border radius 12px
```

#### Colors
```css
--primary-color: #6366f1 (Indigo)
--success-color: #10b981 (Emerald)
--danger-color: #ef4444 (Red)
--warning-color: #f59e0b (Amber)
--info-color: #06b6d4 (Cyan)
```

### 📱 Responsive Design
- **Mobile First**: Tối ưu cho mobile trước
- **Breakpoints**:
  - < 576px: Extra small (mobile)
  - < 768px: Small (tablet portrait)
  - < 992px: Medium (tablet landscape)
  - < 1200px: Large (desktop)
  - ≥ 1200px: Extra large (wide desktop)

### 🎬 Hero Section
- **Gradient Background**: Gradient 3 màu đẹp mắt
- **Glassmorphism**: Stats card với backdrop blur
- **Animated Stats**: Số liệu xuất hiện với animation
- **CTA Buttons**: 2 nút chính với styles khác nhau

### 📊 Progress Bars
- **Shimmer Effect**: Hiệu ứng lấp lánh trên thanh tiến độ
- **Gradient Fill**: Màu gradient xanh lá
- **Shadow Glow**: Phát sáng nhẹ xung quanh
- **Smooth Animation**: Chạy mượt mà 1.5s

### 🎪 Modal & Alerts
- **Slide In**: Alert trượt vào từ bên phải
- **Gradient Background**: Màu gradient nhạt cho từng loại
- **Border Left**: Viền trái với màu tương ứng
- **Auto Dismiss**: Tự động đóng sau vài giây

## 🚀 Cách Sử Dụng

### 1. Utility Classes Mới

```html
<!-- Animations -->
<div class="fade-in-up">Content xuất hiện từ dưới lên</div>
<div class="slide-in-right">Content trượt từ phải sang</div>
<div class="scale-in">Content phóng to ra</div>

<!-- Hover Effects -->
<button class="hover-lift">Nút nâng lên khi hover</button>
<div class="hover-scale">Phóng to khi hover</div>

<!-- Text -->
<h2 class="text-gradient">Chữ gradient đẹp</h2>
<p class="text-truncate-2">Giới hạn 2 dòng</p>
<p class="text-truncate-3">Giới hạn 3 dòng</p>

<!-- Layout -->
<div class="bg-gradient-light">Background gradient nhạt</div>
<div class="rounded-3">Border radius 12px</div>
```

### 2. Custom Scrollbar
Tự động áp dụng cho toàn bộ trang với gradient đẹp mắt

### 3. Loading States
```html
<!-- Loading overlay toàn màn hình -->
<div class="loading-overlay">
    <div class="spinner-border text-primary"></div>
</div>
```

## 🎯 Best Practices

### Layout
- Sử dụng `container` cho content
- Spacing: `py-5` cho sections, `mb-4` cho headings
- Grid: `row g-4` cho spacing đều giữa columns

### Typography
- Headings: `fw-bold` (700) hoặc `fw-bolder` (800)
- Body: Default weight (400)
- Buttons: `fw-semibold` (600)

### Spacing Scale
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 3rem (48px)

### Colors Usage
- **Primary**: CTA chính, links quan trọng
- **Success**: Trạng thái thành công, progress
- **Danger**: Lỗi, cảnh báo quan trọng
- **Warning**: Cảnh báo thông thường
- **Info**: Thông tin bổ sung

## 🔧 Tùy Chỉnh

### Thay đổi màu chính
```css
:root {
    --primary-color: #YOUR_COLOR;
    --primary-dark: #DARKER_SHADE;
    --primary-light: #LIGHTER_SHADE;
}
```

### Thay đổi border radius
```css
:root {
    --border-radius: 12px;
    --border-radius-sm: 8px;
}
```

### Thay đổi shadow
```css
:root {
    --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

## 📦 Dependencies

### Required
- Bootstrap 5.3.0
- Font Awesome 6.0.0
- Inter Font (Google Fonts)

### Optional
- AOS (Animate On Scroll) - Có thể thêm cho animations phức tạp hơn
- Typed.js - Cho hero text animations

## 🎨 Design System

### Spacing
```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
```

### Font Sizes
```
xs: 0.75rem (12px)
sm: 0.875rem (14px)
base: 1rem (16px)
lg: 1.125rem (18px)
xl: 1.25rem (20px)
2xl: 1.5rem (24px)
3xl: 1.875rem (30px)
4xl: 2.25rem (36px)
```

### Z-Index Scale
```
dropdown: 1000
sticky: 1020
fixed: 1030
modal-backdrop: 1040
modal: 1050
popover: 1060
tooltip: 1070
```

## 🚀 Performance

### Optimizations
- CSS variables cho dễ customize
- Transform thay vì position cho animations
- Will-change hint cho animations phức tạp
- Backdrop-filter với fallback
- Lazy loading cho images

### Best Practices
- Sử dụng `transform` thay vì `top/left` cho animations
- Giới hạn số lượng box-shadows
- Optimize animations với `will-change`
- Sử dụng CSS containment khi có thể

## 📱 Mobile Optimization

### Touch Targets
- Minimum 44x44px cho buttons
- Spacing đủ giữa các interactive elements
- Không overlap interactive elements

### Performance
- Reduce animations trên mobile
- Optimize images với srcset
- Lazy load images below the fold

## 🎯 Accessibility

### WCAG 2.1 Compliance
- Color contrast ratio ≥ 4.5:1
- Focus indicators rõ ràng
- Semantic HTML
- ARIA labels khi cần
- Keyboard navigation

### Screen Reader Support
- Alt text cho images
- ARIA labels cho icons
- Proper heading hierarchy
- Skip navigation links

## 🔄 Migration từ giao diện cũ

### Breaking Changes
- Color variables đổi tên
- Button classes mới
- Card structure khác
- Grid spacing mới

### Migration Steps
1. Update CSS imports
2. Replace old color variables
3. Update button classes
4. Add new animation classes
5. Test responsive breakpoints

---

**Made with 💜 by QuyTuThien Team**
