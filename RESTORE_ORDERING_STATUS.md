# ✅ KHÔI PHỤC LOGIC STATUS 'ordering'

## 📋 TÓM TẮT THAY ĐỔI

### 1️⃣ CHỈ XÓA ĐƠN HÀNG STATUS = `'ordering'`
- ✅ API DELETE chỉ cho phép xóa đơn `ordering`
- ✅ Không thể xóa đơn `pending` hoặc `completed`
- ✅ Button "🗑️ Xóa" chỉ hiện với đơn `ordering`

### 2️⃣ HIỂN THỊ ĐÚNG TRẠNG THÁI
- ✅ Tạo đơn → status = `'ordering'` (hiển thị "⏳ Đang xử lý")
- ✅ Tiến hành lấy sách thành công → status = `'pending'` (hiển thị "📖 Đang mượn")
- ✅ Trả hết sách → status = `'completed'` (hiển thị "✓ Đã hoàn thành")

---

## 📂 FILES ĐÃ CHỈNH SỬA (7 files)

### Backend API
1. **`pages/api/orders/[orderId].js`**
   - Đổi điều kiện: `if (order.status !== 'ordering')`
   - Chỉ cho phép xóa đơn có status='ordering'

2. **`pages/api/orders/index.js`**
   - Đổi: `status: 'pending'` → `status: 'ordering'`
   - Console log: "Created order with status: ordering"

3. **`pages/api/robot/borrow.js`**
   - Validate: `order.status !== 'ordering'`
   - CẬP NHẬT status: `ordering → pending`
   - Return: `statusChanged: 'ordering → pending'`

### Frontend
4. **`pages/robot.js`**
   - Kiểm tra: `orderData.status !== 'ordering'`
   - Toast: "Đơn hàng: ordering → pending"

5. **`pages/user.js`**
   - Button xóa chỉ hiện với `order.status === 'ordering'`
   - Status badge màu vàng: `'bg-yellow-100 text-yellow-800'`
   - Label: `'⏳ Đang xử lý'`

6. **`pages/admin.js`**
   - Button xóa chỉ hiện với `order.status === 'ordering'`
   - Status badge màu vàng: `'bg-yellow-100 text-yellow-800'`
   - Label: `'Đang xử lý'`

### Database
7. **`database/setup.sql`**
   - Enum: `('ordering', 'pending', 'completed')`
   - Default: `status order_status NOT NULL DEFAULT 'ordering'`

---

## 🔄 WORKFLOW

### Cũ (SAI):
```
1. Tạo đơn → status='pending' (❌ SAI)
2. Gửi JSON thành công → popup, status vẫn='pending'
3. Không thể xóa đơn 'pending'
```

### Mới (ĐÚNG):
```
1. Tạo đơn → status='ordering' (⏳ Đang xử lý) ✅
   → Có thể XÓA ở giai đoạn này

2. Tiến hành lấy sách (gửi JSON thành công) → status='pending' (📖 Đang mượn) ✅
   → KHÔNG thể xóa nữa

3. Trả hết sách → status='completed' (✓ Đã hoàn thành) ✅
```

---

## 🎨 HIỂN THỊ STATUS

### User.js & Admin.js:
```javascript
{order.status === 'completed' 
  ? '✓ Đã hoàn thành'        // Xanh lá
  : order.status === 'pending' 
  ? '📖 Đang mượn'            // Xanh dương
  : '⏳ Đang xử lý'}          // Vàng (ordering)
```

### Màu badge:
- `ordering`: `bg-yellow-100 text-yellow-800` (vàng)
- `pending`: `bg-blue-100 text-blue-800` (xanh dương)
- `completed`: `bg-green-100 text-green-800` (xanh lá)

---

## 🗑️ CHỨC NĂNG XÓA

### User:
- Chỉ xóa đơn có `status='ordering'`
- Button "🗑️ Xóa" hiển thị bên cạnh badge vàng
- Error: "Chỉ có thể xóa đơn hàng đang xử lý (chưa lấy sách)"

### Admin:
- Chỉ xóa đơn có `status='ordering'`
- Button "🗑️" nhỏ gọn
- Error: "Chỉ có thể xóa đơn hàng đang xử lý (chưa lấy sách)"

### Khi xóa:
1. ✅ Cộng lại `book_lefts` cho các sách
2. ✅ Xóa `order_detail`
3. ✅ Xóa `orders`
4. ✅ Reload danh sách

---

## 🚀 CẬP NHẬT DATABASE

### Nếu database CHƯA CÓ 'ordering':
```sql
-- Chạy file này trên Supabase SQL Editor
database/add_order_status.sql
```

Script sẽ:
- Thêm giá trị `'ordering'` vào enum `order_status`
- Kiểm tra xem đã tồn tại chưa (tránh lỗi duplicate)

### Nếu database MỚI:
```sql
-- Chạy file setup.sql (đã có 'ordering' sẵn)
database/setup.sql
```

---

## ✅ KIỂM TRA

### Test tạo đơn:
1. Thêm sách vào giỏ
2. Click "Đặt mượn"
3. Kiểm tra:
   - ✅ Status hiển thị: "⏳ Đang xử lý" (màu vàng)
   - ✅ Có button "🗑️ Xóa"
   - ✅ `book_lefts` đã giảm

### Test xóa đơn:
1. Đơn mới (status='ordering')
2. Click "🗑️ Xóa"
3. Kiểm tra:
   - ✅ Đơn đã bị xóa
   - ✅ `book_lefts` đã tăng lại

### Test tiến hành lấy sách:
1. Đơn có status='ordering'
2. Vào Robot page → Nhập Order ID
3. Click "Tiến hành lấy sách"
4. Kiểm tra:
   - ✅ Popup: "ordering → pending"
   - ✅ Status đổi thành "📖 Đang mượn" (màu xanh dương)
   - ✅ Button "🗑️ Xóa" biến mất

### Test xóa đơn pending:
1. Đơn đã "Tiến hành lấy sách" (status='pending')
2. Thử click button xóa (không có button)
3. Nếu gọi API trực tiếp:
   - ❌ Error: "Chỉ có thể xóa đơn hàng đang xử lý"

---

## 📊 SO SÁNH

| Tính năng | Trước | Sau |
|-----------|-------|-----|
| Tạo đơn | status='pending' ❌ | status='ordering' ✅ |
| Hiển thị đơn mới | "📖 Đang mượn" ❌ | "⏳ Đang xử lý" ✅ |
| Xóa đơn mới | Không xóa được ❌ | Xóa được ✅ |
| Sau "Tiến hành" | Không đổi status ❌ | ordering→pending ✅ |
| Xóa đơn pending | Xóa được ❌ | Không xóa được ✅ |

---

## 🎯 KẾT QUẢ

✅ **Hoàn tất 100% yêu cầu**:
1. Chỉ xóa đơn có status='ordering' ✓
2. Hiển thị đúng "Đang xử lý" cho đơn mới ✓
3. Workflow đúng: ordering → pending → completed ✓

🎉 **Hệ thống đã hoạt động đúng như mong muốn!**
