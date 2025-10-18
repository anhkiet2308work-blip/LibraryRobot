# 📊 Cập nhật: Biểu đồ Thống kê với tùy chọn Tháng/Tuần

## ✨ Tính năng mới

Đã thêm tùy chọn xem thống kê theo **Tháng** hoặc **Tuần** cho cả User và Admin.

### 📅 Theo Tháng (Month)
- Hiển thị **12 cột** tương ứng với 12 tháng gần nhất
- Tính từ tháng hiện tại về trước 11 tháng
- Ví dụ: Tháng 10/2025 → hiển thị từ 11/2024 đến 10/2025

### 📆 Theo Tuần (Week)
- Hiển thị **4 cột** tương ứng với 4 tuần trong **tháng hiện tại**
- Tuần 1: Ngày 1-7
- Tuần 2: Ngày 8-14
- Tuần 3: Ngày 15-21
- Tuần 4: Ngày 22-31

## 🔄 Files đã cập nhật

### 1. Backend API

#### `pages/api/statistics/user/[userId].js`
- ✅ Thêm query parameter `period` (month/week)
- ✅ Logic xử lý riêng cho month và week
- ✅ Trả về `borrowingData` thay vì `monthlyBorrowing`

**Logic Month:**
```javascript
// Tạo 12 tháng mặc định với count = 0
const now = new Date();
const monthsData = {};
for (let i = 11; i >= 0; i--) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  monthsData[`${d.getFullYear()}-${d.getMonth() + 1}`] = { 
    month: d.getMonth() + 1, 
    year: d.getFullYear(), 
    count: 0 
  };
}
// Sau đó đếm orders vào từng tháng
```

**Logic Week:**
```javascript
// Lấy orders trong tháng hiện tại
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

// Nhóm theo tuần 1-4 dựa trên ngày trong tháng
const weekNumber = Math.ceil(dayOfMonth / 7);
```

#### `pages/api/statistics/admin.js`
- ✅ Tương tự như user API nhưng query toàn hệ thống (không filter user_id)
- ✅ Vẫn giữ logic overview (4 cards tổng quan)

### 2. Frontend Components

#### `components/MonthlyBorrowingChart.js`
- ✅ Thêm prop `period` để phân biệt month/week
- ✅ Thay đổi labels và title dựa trên period
- ✅ Week: Hiển thị "Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"
- ✅ Month: Hiển thị "Th10 2024", "Th11 2024", ...

```javascript
if (period === 'week') {
  labels = data.map(item => item.period); // "Tuần 1", "Tuần 2"...
  chartTitle = 'Thống kê mượn sách theo tuần (Tháng hiện tại)';
} else {
  labels = data.map(item => `${monthNames[item.month - 1]} ${item.year}`);
  chartTitle = 'Thống kê mượn sách theo tháng (12 tháng gần nhất)';
}
```

### 3. API Client

#### `lib/api.js`
- ✅ `getUserStatistics(userId, period = 'month')` - Thêm param period
- ✅ `getAdminStatistics(period = 'month')` - Thêm param period
- ✅ Pass period vào query string: `?period=month` hoặc `?period=week`

### 4. User Page

#### `pages/user.js`
- ✅ Thêm state `statsPeriod` (mặc định 'month')
- ✅ Thêm function `handlePeriodChange()` để đổi period
- ✅ Thêm 2 nút toggle: "📅 Theo tháng" và "📆 Theo tuần"
- ✅ Pass `period={statsPeriod}` vào `MonthlyBorrowingChart`
- ✅ Đổi `statistics.monthlyBorrowing` → `statistics.borrowingData`

**UI Toggle:**
```jsx
<div className="mb-6 flex space-x-3">
  <Button
    onClick={() => handlePeriodChange('month')}
    variant={statsPeriod === 'month' ? 'primary' : 'outline'}
    className="flex-1"
  >
    📅 Theo tháng (12 tháng)
  </Button>
  <Button
    onClick={() => handlePeriodChange('week')}
    variant={statsPeriod === 'week' ? 'primary' : 'outline'}
    className="flex-1"
  >
    📆 Theo tuần (Tháng này)
  </Button>
</div>
```

### 5. Admin Page

#### `pages/admin.js`
- ✅ Tương tự User page
- ✅ Thêm state `statsPeriod`
- ✅ Thêm function `handlePeriodChange()`
- ✅ Thêm 2 nút toggle
- ✅ Đổi `statistics.monthlyBorrowing` → `statistics.borrowingData`

## 📊 Data Structure

### API Response - Month Mode
```json
{
  "borrowingData": [
    { "month": 11, "year": 2024, "count": 5 },
    { "month": 12, "year": 2024, "count": 8 },
    { "month": 1, "year": 2025, "count": 3 },
    ...
    { "month": 10, "year": 2025, "count": 12 }
  ],
  "returnStatus": [...],
  "period": "month"
}
```

### API Response - Week Mode
```json
{
  "borrowingData": [
    { "period": "Tuần 1", "count": 3 },
    { "period": "Tuần 2", "count": 5 },
    { "period": "Tuần 3", "count": 2 },
    { "period": "Tuần 4", "count": 7 }
  ],
  "returnStatus": [...],
  "period": "week"
}
```

## ✅ Kiểm tra Logic User vs Admin

### User API (`/api/statistics/user/[userId]`)
```javascript
// ĐÚNG: Filter theo user_id
.eq('user_id', userId)

// Month: Lấy orders của user trong 12 tháng
.select('order_id, ts_created')
.eq('user_id', userId)
.gte('ts_created', ...) // 12 months ago

// Week: Lấy orders của user trong tháng hiện tại
.select('order_id, ts_created')
.eq('user_id', userId)
.gte('ts_created', firstDayOfMonth)
.lte('ts_created', lastDayOfMonth)

// Return status: Chỉ order_detail của user
.select('return_timestamp, order_id, orders!inner(user_id)')
.eq('orders.user_id', userId)
```

### Admin API (`/api/statistics/admin`)
```javascript
// ĐÚNG: Không filter user_id (toàn hệ thống)

// Month: Lấy TẤT CẢ orders trong 12 tháng
.select('order_id, ts_created')
.gte('ts_created', ...) // 12 months ago
// Không có .eq('user_id', ...)

// Week: Lấy TẤT CẢ orders trong tháng hiện tại
.select('order_id, ts_created')
.gte('ts_created', firstDayOfMonth)
.lte('ts_created', lastDayOfMonth)
// Không có .eq('user_id', ...)

// Return status: TẤT CẢ order_detail
.select('return_timestamp')
// Không filter user_id
```

### Overview (Admin only)
```javascript
// Tổng quan hệ thống - chỉ có ở Admin
const overview = [{
  total_users: <count from user table>,
  total_books: <count from book table>,
  total_orders: <count from orders table>,
  active_orders: <count from orders WHERE status='pending'>
}];
```

## 🎯 Kết luận về Logic

✅ **User API**: 
- Chỉ lấy data của user cụ thể (filter by `user_id`)
- Đúng cho cả month và week mode

✅ **Admin API**: 
- Lấy data toàn hệ thống (không filter user_id)
- Đúng cho cả month và week mode
- Có thêm overview cards

## 🚀 Test

### Test User Statistics
1. Đăng nhập user: http://localhost:3001/user
2. Click tab "📊 Thống kê"
3. Mặc định hiển thị "Theo tháng" với 12 cột
4. Click "📆 Theo tuần" → Thấy 4 cột (Tuần 1-4)
5. Switch qua lại → Data cập nhật real-time

### Test Admin Statistics
1. Đăng nhập admin: http://localhost:3001/admin
2. Click tab "📈 Thống kê"
3. Thấy 4 cards tổng quan ở trên
4. Thấy toggle Month/Week
5. Switch qua lại → Biểu đồ thay đổi

## 📝 Notes

### Hiển thị 12 tháng luôn có đủ 12 cột
- Ngay cả khi không có orders trong tháng đó → count = 0
- Đảm bảo biểu đồ luôn có 12 cột đầy đủ

### Hiển thị 4 tuần luôn có đủ 4 cột
- Ngay cả khi không có orders trong tuần đó → count = 0
- Đảm bảo biểu đồ luôn có 4 cột đầy đủ

### Tính tuần theo ngày trong tháng
- Ngày 1-7: Tuần 1
- Ngày 8-14: Tuần 2
- Ngày 15-21: Tuần 3
- Ngày 22-31: Tuần 4

### Return Status Chart không đổi
- Biểu đồ tròn (Pie chart) không phụ thuộc vào period
- Luôn hiển thị tổng số sách đã trả/chưa trả (toàn bộ lịch sử)

## 🎉 Hoàn thành

✅ User statistics với toggle month/week
✅ Admin statistics với toggle month/week  
✅ Logic phân biệt user data vs system-wide data
✅ Hiển thị đủ 12 cột (month) hoặc 4 cột (week)
✅ Chart title thay đổi theo period
✅ Real-time update khi switch mode

Refresh browser và test ngay! 🚀
