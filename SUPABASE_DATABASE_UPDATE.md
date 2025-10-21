# 🔧 HƯỚNG DẪN CẬP NHẬT DATABASE TRỰC TIẾP TRÊN SUPABASE

## ⚠️ QUAN TRỌNG
**KHÔNG dùng database demo trên máy local!**  
**PHẢI truy vấn trực tiếp trên Supabase Dashboard để cập nhật dữ liệu.**

---

## 📍 BƯỚC 1: TRUY CẬP SUPABASE DASHBOARD

1. Mở trình duyệt, truy cập: **https://supabase.com**
2. Đăng nhập tài khoản Supabase
3. Chọn project của bạn (LibraryRobot hoặc tên project bạn đặt)
4. Vào menu bên trái: **SQL Editor** (biểu tượng database)

---

## 📍 BƯỚC 2: KIỂM TRA ENUM HIỆN TẠI

Chạy câu lệnh sau trong SQL Editor:

```sql
-- Kiểm tra các giá trị enum hiện tại
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;
```

### Kết quả mong đợi:
```
enumlabel
---------
ordering   (nếu đã có)
pending
completed
```

**Nếu CHƯA CÓ `'ordering'`** → Chạy BƯỚC 3  
**Nếu ĐÃ CÓ `'ordering'`** → Bỏ qua BƯỚC 3, chuyển sang BƯỚC 4

---

## 📍 BƯỚC 3: THÊM GIÁ TRỊ 'ordering' VÀO ENUM

Copy toàn bộ đoạn code dưới đây và paste vào SQL Editor, sau đó click **RUN**:

```sql
-- =====================================================
-- THÊM STATUS 'ordering' VÀO ENUM order_status
-- =====================================================

DO $$
BEGIN
  -- Kiểm tra xem 'ordering' đã tồn tại chưa
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ordering' 
    AND enumtypid = 'order_status'::regtype
  ) THEN
    -- Thêm 'ordering' vào trước 'pending'
    ALTER TYPE order_status ADD VALUE 'ordering' BEFORE 'pending';
    RAISE NOTICE '✅ Đã thêm status ''ordering'' vào enum';
  ELSE
    RAISE NOTICE 'ℹ️ Status ''ordering'' đã tồn tại';
  END IF;
END $$;
```

### Kết quả mong đợi:
```
NOTICE: ✅ Đã thêm status 'ordering' vào enum
```

---

## 📍 BƯỚC 4: CẬP NHẬT CÁC ĐƠN HÀNG HIỆN TẠI (NẾU CẦN)

Nếu database đã có dữ liệu và các đơn hàng đang ở status `'pending'` nhưng chưa lấy sách, cần chuyển về `'ordering'`:

```sql
-- =====================================================
-- CẬP NHẬT CÁC ĐƠN HÀNG
-- =====================================================

-- Xem các đơn hàng hiện tại
SELECT order_id, status, ts_created 
FROM orders 
ORDER BY ts_created DESC 
LIMIT 10;
```

**Nếu thấy đơn hàng mới tạo nhưng status='pending' → Cần chuyển về 'ordering':**

```sql
-- Chuyển các đơn pending mới (chưa có trong order_detail hoặc chưa lấy sách)
-- về ordering
UPDATE orders 
SET status = 'ordering'::order_status
WHERE status = 'pending'::order_status
  AND order_id IN (
    -- Lấy các đơn có tất cả sách chưa được lấy (return_timestamp = NULL)
    SELECT o.order_id 
    FROM orders o
    LEFT JOIN order_detail od ON o.order_id = od.order_id
    WHERE o.status = 'pending'
    GROUP BY o.order_id
    HAVING COUNT(od.return_timestamp) = 0
  );

-- Kiểm tra kết quả
SELECT order_id, status, ts_created 
FROM orders 
ORDER BY ts_created DESC;
```

---

## 📍 BƯỚC 5: KIỂM TRA KẾT QUẢ

Chạy các câu lệnh sau để xác nhận:

```sql
-- 1. Kiểm tra enum đã có 'ordering'
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;

-- 2. Thống kê số đơn hàng theo status
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status;

-- 3. Xem chi tiết các đơn hàng mới nhất
SELECT 
  order_id,
  status,
  ts_created,
  (SELECT COUNT(*) FROM order_detail WHERE order_id = o.order_id) as total_books
FROM orders o
ORDER BY ts_created DESC
LIMIT 10;
```

### Kết quả mong đợi:
```
enumlabel
---------
ordering
pending
completed

status    | count
----------+------
ordering  |  X
pending   |  Y
completed |  Z
```

---

## 📍 BƯỚC 6: CẬP NHẬT TABLE DEFAULT VALUE (TÙY CHỌN)

Để các đơn hàng mới luôn có status='ordering' mặc định:

```sql
-- Cập nhật default value của cột status
ALTER TABLE orders 
ALTER COLUMN status SET DEFAULT 'ordering'::order_status;

-- Kiểm tra
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name = 'status';
```

### Kết quả mong đợi:
```
column_name | column_default
------------+------------------
status      | 'ordering'::order_status
```

---

## 🚨 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: "type 'order_status' does not exist"
**Nguyên nhân**: Chưa tạo enum type

**Giải pháp**: Tạo enum từ đầu
```sql
CREATE TYPE order_status AS ENUM ('ordering', 'pending', 'completed');
```

### Lỗi 2: "enum label 'ordering' already exists"
**Nguyên nhân**: Đã thêm 'ordering' rồi

**Giải pháp**: Không cần làm gì, bỏ qua BƯỚC 3

### Lỗi 3: "cannot convert type pending to ordering"
**Nguyên nhân**: Đơn hàng đang ở status không hợp lệ

**Giải pháp**: Kiểm tra lại điều kiện WHERE trong câu UPDATE

---

## 📊 KIỂM TRA SAU KHI CẬP NHẬT

### Test trên ứng dụng:

1. **Tạo đơn hàng mới**:
   - Vào User page
   - Thêm sách vào giỏ
   - Click "Đặt mượn"
   - ✅ Kiểm tra: Status hiển thị "⏳ Đang xử lý" (màu vàng)
   - ✅ Có button "🗑️ Xóa"

2. **Kiểm tra database**:
```sql
SELECT order_id, status, ts_created 
FROM orders 
WHERE user_id = <your_user_id>
ORDER BY ts_created DESC 
LIMIT 1;
```
   - ✅ Status phải là `'ordering'`

3. **Tiến hành lấy sách**:
   - Vào Robot page
   - Nhập Order ID
   - Click "Tiến hành lấy sách"
   - ✅ Status chuyển thành "📖 Đang mượn" (xanh dương)

4. **Kiểm tra database sau lấy sách**:
```sql
SELECT order_id, status 
FROM orders 
WHERE order_id = <order_id_vua_lay_sach>;
```
   - ✅ Status phải là `'pending'`

---

## 📋 CHECKLIST HOÀN TẤT

- [ ] Đăng nhập Supabase Dashboard
- [ ] Kiểm tra enum hiện tại (BƯỚC 2)
- [ ] Thêm 'ordering' nếu chưa có (BƯỚC 3)
- [ ] Cập nhật đơn hàng cũ nếu cần (BƯỚC 4)
- [ ] Kiểm tra kết quả (BƯỚC 5)
- [ ] Cập nhật default value (BƯỚC 6)
- [ ] Test trên ứng dụng
- [ ] Xác nhận workflow: ordering → pending → completed

---

## 🎯 KẾT QUẢ MONG ĐỢI

Sau khi hoàn tất:
- ✅ Enum `order_status` có 3 giá trị: `'ordering'`, `'pending'`, `'completed'`
- ✅ Tạo đơn mới → status = `'ordering'`
- ✅ Hiển thị: "⏳ Đang xử lý" (màu vàng)
- ✅ Có thể xóa đơn `'ordering'`
- ✅ Sau "Tiến hành lấy sách" → status = `'pending'`
- ✅ KHÔNG thể xóa đơn `'pending'` hoặc `'completed'`

---

## 📞 HỖ TRỢ

Nếu gặp lỗi:
1. Chụp màn hình thông báo lỗi trong SQL Editor
2. Copy câu SQL đã chạy
3. Kiểm tra lại từng bước trong hướng dẫn
4. Đảm bảo đã chọn đúng database/project trên Supabase

🎉 **Chúc bạn thành công!**
