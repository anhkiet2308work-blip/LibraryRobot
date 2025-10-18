# 🚀 HƯỚNG DẪN CHẠY PROJECT

## Bước 1: Setup Database trên Supabase

1. Truy cập: https://supabase.com/dashboard/project/swtrsshxprlbimexurms/sql
2. Copy toàn bộ nội dung file `database/setup.sql`
3. Paste vào SQL Editor và click "Run"
4. Đợi script chạy xong (tạo bảng + data demo)

## Bước 2: Chạy ứng dụng

```bash
npm run dev
```

## Bước 3: Truy cập ứng dụng

Mở trình duyệt: **http://localhost:3000**

---

## 🔐 THÔNG TIN ĐĂNG NHẬP

### Admin:
- **Email**: admin@library.com
- **Password**: admin123

### User:
- **Email**: user1@library.com
- **Password**: user123

### Robot:
- Không cần đăng nhập, click "🤖 Giao diện Robot"

---

## 📖 HƯỚNG DẪN SỬ DỤNG

### Người dùng (User):
1. Đăng nhập với tài khoản user
2. Tab "Duyệt sách": Xem và thêm sách vào giỏ
3. Tab "Giỏ hàng": Tạo đơn hàng (Ghi nhớ Order ID)
4. Quay lại trang chủ → Giao diện Robot
5. Chọn "Mượn sách" → Nhập Order ID
6. Quét/nhập RFID các sách → Xác nhận

### Quản trị viên (Admin):
1. Đăng nhập với tài khoản admin
2. **Quản lý người dùng**: Thêm/xóa users
3. **Quản lý sách**: Thêm/sửa/xóa sách, cập nhật số lượng và vị trí
4. **Báo cáo**: Xem tất cả đơn hàng và trạng thái

### Robot:
1. **Mượn sách**:
   - Nhập Order ID
   - Quét RFID từng sách
   - Xác nhận → Hệ thống tự động trừ book_lefts

2. **Trả sách**:
   - Nhập Order ID
   - Quét RFID từng sách trả lại
   - Xác nhận → Hệ thống tự động:
     * Cộng book_lefts
     * Cập nhật return_timestamp
     * Đổi status thành 'completed' nếu đã trả hết

---

## 📝 TEST FLOW HOÀN CHỈNH

### Scenario 1: Mượn và trả sách

1. **Login User** (user1@library.com / user123)
2. Thêm 3 sách vào giỏ hàng: RFID001, RFID002, RFID003
3. Tạo đơn hàng → Nhận Order ID (ví dụ: #1)
4. **Logout → Robot Interface**
5. Chọn "Mượn sách" → Nhập Order ID: 1
6. Quét: RFID001, RFID002, RFID003
7. Xác nhận → Check database: book_lefts đã giảm
8. Chọn "Trả sách" → Nhập Order ID: 1
9. Quét: RFID001, RFID002
10. Xác nhận → Check: book_lefts tăng, status vẫn 'pending'
11. Trả sách cuối: RFID003
12. Xác nhận → Check: status tự động chuyển 'completed'

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Cannot connect to database"
- Kiểm tra `.env.local` có đúng thông tin không
- Kiểm tra Supabase project còn active không

### Lỗi: "No such table"
- Chạy lại script `database/setup.sql` trên Supabase

### Port 3000 đã được sử dụng:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Hoặc đổi port
npm run dev -- -p 3001
```

---

## 📊 CẤU TRÚC DATABASE

```
users (user_id, email, password, role, created_at)
  ↓
orders (order_id, user_id, ts_created, status)
  ↓
order_detail (order_id, rfid, return_timestamp)
  ↓
book (rfid, name, book_lefts, position_x, position_y, position_z)
```

---

## ✨ TÍNH NĂNG NỔI BẬT

✅ Tự động cập nhật trạng thái đơn hàng (Trigger)
✅ Validation đầy đủ (RFID phải thuộc order, book_lefts >= 0)
✅ UI thân thiện, responsive
✅ Real-time feedback với Toast notifications
✅ Hỗ trợ vị trí 3D cho sách (X, Y, Z)
✅ Lịch sử mượn trả chi tiết

---

Chúc bạn thành công! 🎉
