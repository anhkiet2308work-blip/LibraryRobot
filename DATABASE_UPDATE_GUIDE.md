# Hướng dẫn cập nhật Database cho logic mới

## ⚠️ QUAN TRỌNG: Chạy script SQL này trên Supabase

### Bước 1: Thêm trạng thái 'ordering' vào enum

```sql
-- Thêm trạng thái mới vào enum order_status
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ordering';
```

### Bước 2: Cập nhật các đơn hàng hiện tại

```sql
-- Cập nhật các đơn 'pending' cũ thành 'ordering' nếu chưa có return_timestamp
UPDATE orders o
SET status = 'ordering'
WHERE status = 'pending'
AND NOT EXISTS (
  SELECT 1 FROM order_detail od
  WHERE od.order_id = o.order_id 
  AND od.return_timestamp IS NULL
);

-- Kiểm tra kết quả
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;
```

### Bước 3: Kiểm tra cấu trúc

```sql
-- Xem các giá trị enum hiện tại
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;

-- Kết quả mong đợi:
-- ordering
-- pending
-- completed
```

## 📊 Giải thích trạng thái mới

| Status | Tên hiển thị | Khi nào? |
|--------|--------------|----------|
| `ordering` | 📝 Đã đặt đơn | Sau khi user tạo đơn hàng |
| `pending` | 📖 Đang mượn | Sau khi Robot gửi JSON thành công đến COM |
| `completed` | ✓ Đã hoàn thành | Sau khi trả hết sách |

## 🔄 Luồng chuyển đổi status

```
1. User tạo đơn → status = 'ordering'
   (book_lefts đã bị trừ)

2. Robot > "Tiến hành lấy sách" > Gửi JSON thành công → status = 'pending'
   (Chỉ đổi status khi gửi COM thành công)

3. Robot > Trả sách > Quét RFID > Trả hết → status = 'completed'
   (Trigger tự động)
```

## ✅ Kiểm tra sau khi cập nhật

```sql
-- Test 1: Tạo đơn mới
INSERT INTO orders (user_id, status) 
VALUES (2, DEFAULT) 
RETURNING order_id, status;
-- Kết quả: status phải là 'ordering'

-- Test 2: Xem tất cả đơn
SELECT order_id, user_id, status, ts_created 
FROM orders 
ORDER BY order_id DESC 
LIMIT 10;

-- Test 3: Kiểm tra trigger vẫn hoạt động
SELECT * FROM orders WHERE status = 'completed';
```

## 🐛 Troubleshooting

### Lỗi: "invalid input value for enum order_status"
```sql
-- Kiểm tra giá trị status hiện tại
SELECT DISTINCT status FROM orders;

-- Nếu có giá trị không hợp lệ, sửa lại:
UPDATE orders SET status = 'ordering' WHERE status NOT IN ('ordering', 'pending', 'completed');
```

### Lỗi: "type already exists"
```sql
-- Enum đã có giá trị 'ordering', bỏ qua lỗi này
-- Hoặc kiểm tra:
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'order_status'::regtype;
```

## 📝 Ghi chú quan trọng

1. **KHÔNG XÓA** enum 'pending' hoặc 'completed' - vẫn cần dùng
2. **PHẢI CHẠY** script này trước khi deploy code mới
3. **book_lefts** vẫn trừ khi tạo đơn (ordering), không đổi logic này
4. Trigger `trg_orders_autocomplete` vẫn hoạt động bình thường

## 🚀 Sau khi cập nhật xong

1. Restart Next.js server: `npm run dev`
2. Test tạo đơn mới → Kiểm tra status = 'ordering'
3. Test "Tiến hành lấy sách" → Kiểm tra status → 'pending'
4. Test trả sách → Kiểm tra status → 'completed'
