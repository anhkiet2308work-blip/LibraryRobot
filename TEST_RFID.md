# Hướng dẫn kiểm tra và cập nhật RFID

## Vấn đề
- Bạn quét RFID: `2516072455`
- Hệ thống báo: "Sách không thuộc đơn hàng"
- Nguyên nhân: RFID trong database khác với RFID thực tế

## Kiểm tra RFID trong database

### Cách 1: Qua Supabase Dashboard
1. Vào https://supabase.com
2. Chọn project của bạn
3. Vào Table Editor > book
4. Xem cột `rfid` của các sách

### Cách 2: Qua SQL Query (Supabase SQL Editor)
```sql
-- Xem tất cả sách và RFID
SELECT rfid, name, book_lefts FROM book ORDER BY name;

-- Kiểm tra đơn hàng nào đang pending
SELECT 
  o.order_id,
  u.email,
  od.rfid,
  b.name as book_name
FROM orders o
JOIN users u ON o.user_id = u.user_id
JOIN order_detail od ON o.order_id = od.order_id
JOIN book b ON od.rfid = b.rfid
WHERE o.status = 'pending'
ORDER BY o.order_id;
```

### Cách 3: Qua Browser Console (F12)
```javascript
// Xem tất cả sách
fetch('/api/books')
  .then(r => r.json())
  .then(books => console.table(books.map(b => ({
    RFID: b.rfid,
    Name: b.name,
    Stock: b.book_lefts
  }))))

// Xem chi tiết đơn hàng (thay [ID] bằng số đơn hàng)
fetch('/api/orders/[ID]')
  .then(r => r.json())
  .then(order => console.table(order.order_detail.map(od => ({
    RFID: od.rfid,
    Type: typeof od.rfid,
    Book: od.book.name
  }))))
```

## Giải pháp

### Option 1: Cập nhật RFID trong database
Nếu `2516072455` là RFID thực tế từ scanner:

```sql
-- Cập nhật RFID cho Book Title 1
UPDATE book 
SET rfid = '2516072455' 
WHERE name = 'Book Title 1';

-- QUAN TRỌNG: Cũng phải cập nhật order_detail
UPDATE order_detail 
SET rfid = '2516072455' 
WHERE rfid = (SELECT rfid FROM book WHERE name = 'Book Title 1');
```

⚠️ **LỖI**: Không thể update trực tiếp như trên vì `rfid` là PRIMARY KEY và FOREIGN KEY!

**Cách đúng:**
1. Xóa order_detail cũ
2. Xóa book cũ  
3. Thêm book mới với RFID thực
4. Thêm lại order_detail

```sql
-- Bước 1: Backup dữ liệu cũ
CREATE TEMP TABLE temp_book AS 
SELECT * FROM book WHERE name = 'Book Title 1';

-- Bước 2: Xóa order_detail liên quan
DELETE FROM order_detail 
WHERE rfid IN (SELECT rfid FROM book WHERE name = 'Book Title 1');

-- Bước 3: Xóa book cũ
DELETE FROM book WHERE name = 'Book Title 1';

-- Bước 4: Thêm book với RFID mới
INSERT INTO book (rfid, name, book_lefts, position_x, position_y, position_z)
SELECT '2516072455', name, book_lefts, position_x, position_y, position_z 
FROM temp_book;

-- Bước 5: Thêm lại vào đơn hàng (nếu cần)
-- INSERT INTO order_detail (order_id, rfid) VALUES (1, '2516072455');
```

### Option 2: Sử dụng RFID có sẵn trong database
Nếu database có RFID `RFID001`, `RFID002`, etc., hãy:
1. Dán nhãn RFID mới lên sách
2. Hoặc map RFID thực với RFID trong database

### Option 3: Tạo bảng mapping RFID
```sql
CREATE TABLE rfid_mapping (
  physical_rfid VARCHAR(64) PRIMARY KEY,
  virtual_rfid VARCHAR(64) REFERENCES book(rfid)
);

INSERT INTO rfid_mapping VALUES
('2516072455', 'RFID001'),
('YOUR_RFID_2', 'RFID002');
```

Sau đó cập nhật code để lookup qua bảng này.

## Khuyến nghị

**Cách NHANH NHẤT**: 
1. Vào Supabase Dashboard
2. Table Editor > book
3. Tìm sách "Book Title 1" (hoặc sách tương tự)
4. Xem RFID hiện tại là gì
5. **Quét RFID đó** thay vì `2516072455`

HOẶC

1. Cập nhật database để dùng RFID thực tế từ scanner
2. Chạy script `update_rfid.sql` (đã tạo)
