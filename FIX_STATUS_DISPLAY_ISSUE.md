# 🚨 SỬA LỖI: ĐƠN HÀNG MỚI HIỂN THỊ SAI TRẠNG THÁI

## ⚠️ VẤN ĐỀ
Đơn hàng mới tạo (#35, #34, #33) đang hiển thị:
- ❌ **"📖 Đang mượn"** (màu xanh dương) - SAI!
- ✅ **Phải là "⏳ Đang xử lý"** (màu vàng)

**Nguyên nhân**: Database Supabase chưa có enum value `'ordering'` hoặc default value vẫn là `'pending'`

---

## 🔧 GIẢI PHÁP - CHẠY TRÊN SUPABASE SQL EDITOR

### 📍 BƯỚC 1: MỞ SUPABASE SQL EDITOR
1. Truy cập: https://supabase.com
2. Đăng nhập
3. Chọn project LibraryRobot
4. Vào menu: **SQL Editor**

---

### 📍 BƯỚC 2: THÊM 'ordering' VÀO ENUM

Copy & paste đoạn này vào SQL Editor, click **RUN**:

```sql
-- Thêm 'ordering' vào enum (nếu chưa có)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ordering' 
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE order_status ADD VALUE 'ordering' BEFORE 'pending';
    RAISE NOTICE '✅ Đã thêm ordering vào enum';
  ELSE
    RAISE NOTICE 'ℹ️ ordering đã tồn tại';
  END IF;
END $$;
```

---

### 📍 BƯỚC 3: ĐỔI DEFAULT VALUE THÀNH 'ordering'

Copy & paste đoạn này, click **RUN**:

```sql
-- Đổi default value của cột status
ALTER TABLE orders 
ALTER COLUMN status SET DEFAULT 'ordering'::order_status;

-- Kiểm tra
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'status';
```

**Kết quả mong đợi**:
```
column_name | column_default
------------+------------------
status      | 'ordering'::order_status
```

---

### 📍 BƯỚC 4: CẬP NHẬT CÁC ĐƠN HÀNG CŨ (ĐÃ TẠO NHƯNG CHƯA LẤY SÁCH)

Copy & paste đoạn này, click **RUN**:

```sql
-- Chuyển các đơn hàng 'pending' nhưng CHƯA lấy sách về 'ordering'
UPDATE orders 
SET status = 'ordering'::order_status
WHERE status = 'pending'::order_status
  AND order_id IN (
    SELECT DISTINCT o.order_id 
    FROM orders o
    INNER JOIN order_detail od ON o.order_id = od.order_id
    WHERE o.status = 'pending'
    GROUP BY o.order_id
    -- Tất cả sách đều chưa trả = chưa lấy sách
    HAVING COUNT(CASE WHEN od.return_timestamp IS NULL THEN 1 END) = COUNT(*)
  );

-- Xem kết quả
SELECT order_id, status, ts_created 
FROM orders 
ORDER BY ts_created DESC 
LIMIT 10;
```

---

### 📍 BƯỚC 5: XÓA CÁC ĐƠN TEST (TÙY CHỌN)

Nếu muốn xóa các đơn #35, #34, #33 để test lại:

```sql
-- Xóa các đơn hàng test (thay order_id cho đúng)
DELETE FROM order_detail WHERE order_id IN (35, 34, 33);
DELETE FROM orders WHERE order_id IN (35, 34, 33);

-- Kiểm tra
SELECT order_id, status FROM orders ORDER BY order_id DESC LIMIT 5;
```

---

### 📍 BƯỚC 6: KIỂM TRA KẾT QUẢ

```sql
-- 1. Kiểm tra enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;

-- 2. Kiểm tra default value
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'status';

-- 3. Kiểm tra các đơn hàng
SELECT 
  order_id, 
  status, 
  ts_created,
  (SELECT COUNT(*) FROM order_detail WHERE order_id = o.order_id) as books
FROM orders o
ORDER BY ts_created DESC
LIMIT 10;
```

**Kết quả mong đợi**:
```
enumlabel: ordering, pending, completed
column_default: 'ordering'::order_status
```

---

## 🧪 TEST SAU KHI CẬP NHẬT

### Test 1: Tạo đơn hàng mới
1. Vào User page
2. Thêm 1-2 sách vào giỏ
3. Click "Đặt mượn"
4. ✅ **Kiểm tra**: Phải hiển thị "⏳ Đang xử lý" (màu vàng)
5. ✅ **Kiểm tra**: Có button "🗑️ Xóa"

### Test 2: Kiểm tra database
```sql
SELECT order_id, status 
FROM orders 
ORDER BY ts_created DESC 
LIMIT 1;
```
✅ **Kết quả**: status = `'ordering'`

### Test 3: Tiến hành lấy sách
1. Vào Robot page
2. Nhập Order ID vừa tạo
3. Click "Tiến hành lấy sách"
4. ✅ **Kiểm tra**: Chuyển thành "📖 Đang mượn" (màu xanh)
5. ✅ **Kiểm tra**: Button "🗑️ Xóa" biến mất

### Test 4: Kiểm tra database sau lấy sách
```sql
SELECT order_id, status 
FROM orders 
WHERE order_id = <id_vua_lay_sach>;
```
✅ **Kết quả**: status = `'pending'`

---

## 📊 SO SÁNH TRƯỚC & SAU

### TRƯỚC (SAI - như trong ảnh):
```
Đơn #35: "📖 Đang mượn" (xanh dương) ❌
Đơn #34: "📖 Đang mượn" (xanh dương) ❌
Đơn #33: "📖 Đang mượn" (xanh dương) ❌
→ Tất cả đều SAI vì vừa mới tạo, chưa lấy sách!
```

### SAU (ĐÚNG):
```
Tạo đơn mới: "⏳ Đang xử lý" (vàng) ✅
→ Có button "🗑️ Xóa"

Sau "Tiến hành lấy sách": "📖 Đang mượn" (xanh) ✅
→ Không có button xóa
```

---

## 🔍 DEBUG: KIỂM TRA CODE ĐÃ ĐÚNG CHƯA

Mở file `pages/api/orders/index.js` và kiểm tra dòng ~74:

```javascript
// Phải là 'ordering', KHÔNG phải 'pending'
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert([{
    user_id: userId,
    status: 'ordering'  // ← Phải là 'ordering'
  }])
```

✅ **Nếu code đã đúng** → Vấn đề ở database Supabase → Chạy SQL ở trên  
❌ **Nếu code vẫn là 'pending'** → Sửa code rồi commit lại

---

## 🎯 CHECKLIST

- [ ] Chạy BƯỚC 2: Thêm 'ordering' vào enum
- [ ] Chạy BƯỚC 3: Đổi default value
- [ ] Chạy BƯỚC 4: Cập nhật đơn hàng cũ
- [ ] Chạy BƯỚC 6: Kiểm tra kết quả
- [ ] Test tạo đơn mới → Phải hiển thị "⏳ Đang xử lý"
- [ ] Test "Tiến hành lấy sách" → Chuyển thành "📖 Đang mượn"
- [ ] Test xóa đơn "ordering" → Được phép xóa
- [ ] Test xóa đơn "pending" → Không được phép

---

## 🆘 NẾU VẪN SAI

Chụp màn hình kết quả của các câu lệnh sau:

```sql
-- 1. Kiểm tra enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype;

-- 2. Kiểm tra default
SELECT column_default FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'status';

-- 3. Kiểm tra đơn mới nhất
SELECT order_id, status, ts_created 
FROM orders 
ORDER BY ts_created DESC LIMIT 1;
```

Gửi lại kết quả để debug tiếp!

🎉 **Sau khi làm đúng, các đơn mới sẽ hiển thị màu VÀNG với text "⏳ Đang xử lý"!**
