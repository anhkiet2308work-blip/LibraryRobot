# Tính năng Thống kê - Hoàn thành ✅

## Tổng quan

Đã triển khai đầy đủ tính năng thống kê với biểu đồ cho cả **User** và **Admin**.

## Files đã tạo/cập nhật

### 1. API Endpoints (Backend)
- ✅ `pages/api/statistics/user/[userId].js` - API thống kê cho user cụ thể
- ✅ `pages/api/statistics/admin.js` - API thống kê toàn hệ thống

### 2. Database
- ✅ `database/statistics_functions.sql` - 5 stored procedures:
  - `get_user_monthly_borrowing()` - Mượn theo tháng của user
  - `get_user_return_status()` - Tình trạng trả của user
  - `get_admin_monthly_borrowing()` - Mượn theo tháng (toàn hệ thống)
  - `get_admin_return_status()` - Tình trạng trả (toàn hệ thống)
  - `get_admin_overview()` - Tổng quan hệ thống

### 3. Components (Biểu đồ)
- ✅ `components/MonthlyBorrowingChart.js` - Biểu đồ cột (Bar chart)
- ✅ `components/ReturnStatusChart.js` - Biểu đồ tròn (Pie chart)

### 4. Frontend Pages
- ✅ `pages/user.js` - Thêm tab "📊 Thống kê"
- ✅ `pages/admin.js` - Thêm tab "📈 Thống kê" + Tổng quan

### 5. API Client
- ✅ `lib/api.js` - Thêm `getUserStatistics()` và `getAdminStatistics()`

### 6. Documentation
- ✅ `docs/STATISTICS_SETUP.md` - Hướng dẫn cài đặt

## Tính năng

### User Statistics (📊 Tab Thống kê)
1. **Biểu đồ cột** - Xu hướng mượn sách theo tháng (12 tháng gần nhất)
2. **Biểu đồ tròn** - Tỷ lệ sách đã trả / chưa trả

### Admin Statistics (📈 Tab Thống kê)
1. **Tổng quan hệ thống** - 4 cards:
   - Tổng số người dùng
   - Tổng số sách
   - Tổng số đơn mượn
   - Số đơn đang mượn
2. **Biểu đồ cột** - Xu hướng mượn sách theo tháng (toàn hệ thống)
3. **Biểu đồ tròn** - Tỷ lệ sách đã trả / chưa trả (toàn hệ thống)

## Dependencies đã cài đặt

```json
{
  "chart.js": "latest",
  "react-chartjs-2": "latest"
}
```

## Cách sử dụng

### Bước 1: Setup Database
Chạy các stored procedures trong Supabase SQL Editor (xem file `docs/STATISTICS_SETUP.md`)

### Bước 2: Khởi động server
```bash
npm run dev
```

### Bước 3: Test
1. Đăng nhập với tài khoản **user** → Tab "📊 Thống kê"
2. Đăng nhập với tài khoản **admin** → Tab "📈 Thống kê"

## Kiến trúc

```
Frontend (user.js / admin.js)
    ↓ gọi getUserStatistics() / getAdminStatistics()
API Client (lib/api.js)
    ↓ fetch /api/statistics/user/[userId] hoặc /api/statistics/admin
API Routes (pages/api/statistics/*)
    ↓ supabase.rpc('get_user_monthly_borrowing', ...)
Stored Procedures (PostgreSQL)
    ↓ truy vấn từ orders, order_detail, user, book
Database
```

## Dữ liệu biểu đồ

### Monthly Borrowing (Biểu đồ cột)
```sql
SELECT EXTRACT(MONTH FROM ts_created), COUNT(*)
FROM orders
WHERE ts_created >= NOW() - INTERVAL '12 months'
GROUP BY EXTRACT(MONTH FROM ts_created)
```

### Return Status (Biểu đồ tròn)
```sql
SELECT 
  CASE 
    WHEN return_timestamp IS NULL THEN 'Chưa trả'
    ELSE 'Đã trả'
  END,
  COUNT(*)
FROM order_detail
GROUP BY (return_timestamp IS NULL)
```

## Screenshots mô tả

### User Statistics Tab
- Biểu đồ cột hiển thị "Thống kê mượn sách theo tháng" với trục X là tháng/năm
- Biểu đồ tròn hiển thị "Tình trạng trả sách" với 2 phần: Đã trả (xanh) / Chưa trả (đỏ)

### Admin Statistics Tab  
- 4 cards tổng quan với số liệu màu sắc: xanh dương, xanh lá, tím, vàng
- Biểu đồ cột và tròn tương tự user nhưng hiển thị dữ liệu toàn hệ thống

## Lưu ý kỹ thuật

1. **Chart.js Registration**: Đã đăng ký các components cần thiết:
   - Bar chart: CategoryScale, LinearScale, BarElement
   - Pie chart: ArcElement

2. **Responsive**: Tất cả biểu đồ đều responsive với `maintainAspectRatio: false`

3. **Empty State**: Hiển thị message "Chưa có dữ liệu" khi không có data

4. **Color Scheme**: 
   - Bar chart: Blue (rgba(59, 130, 246))
   - Pie chart: Green for "Đã trả", Red for "Chưa trả"

5. **Tooltip**: Pie chart có custom tooltip hiển thị phần trăm

## Next Steps (Optional)

- [ ] Thêm filter theo khoảng thời gian (tuần, tháng, năm)
- [ ] Export thống kê ra PDF/Excel
- [ ] Thêm biểu đồ line chart cho xu hướng theo ngày
- [ ] Real-time updates với Supabase Realtime
- [ ] Thêm thống kê top sách được mượn nhiều nhất

## Status

🎉 **HOÀN THÀNH** - Tính năng đã sẵn sàng sử dụng!

Nhớ chạy stored procedures trong Supabase trước khi test.
