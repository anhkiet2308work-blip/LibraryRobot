-- Script để debug đơn hàng và RFID

-- 1. Kiểm tra sách có RFID 2516072455
SELECT rfid, name, book_lefts 
FROM book 
WHERE rfid = '2516072455';

-- 2. Xem tất cả đơn hàng đang pending
SELECT 
  o.order_id,
  o.status,
  u.email,
  o.ts_created
FROM orders o
JOIN users u ON o.user_id = u.user_id
WHERE o.status = 'pending'
ORDER BY o.order_id DESC;

-- 3. Xem chi tiết đơn hàng (thay [ORDER_ID] bằng số đơn hàng)
SELECT 
  od.order_id,
  od.rfid,
  b.name as book_name,
  od.return_timestamp,
  CASE 
    WHEN od.return_timestamp IS NULL THEN 'Chưa trả'
    ELSE 'Đã trả'
  END as status
FROM order_detail od
JOIN book b ON od.rfid = b.rfid
WHERE od.order_id = [ORDER_ID];  -- Thay [ORDER_ID] bằng số thực tế, ví dụ: 1

-- 4. Kiểm tra xem RFID 2516072455 có trong đơn hàng nào không
SELECT 
  od.order_id,
  o.status as order_status,
  od.rfid,
  b.name as book_name,
  od.return_timestamp
FROM order_detail od
JOIN book b ON od.rfid = b.rfid
JOIN orders o ON od.order_id = o.order_id
WHERE od.rfid = '2516072455';

-- 5. Nếu muốn thêm RFID 2516072455 vào đơn hàng (ví dụ đơn 1)
-- INSERT INTO order_detail (order_id, rfid) 
-- VALUES (1, '2516072455');

-- 6. Nếu muốn tạo đơn hàng mới cho test
-- INSERT INTO orders (user_id, status) VALUES (2, 'pending') RETURNING order_id;
-- Sau đó thêm sách vào đơn:
-- INSERT INTO order_detail (order_id, rfid) VALUES ([NEW_ORDER_ID], '2516072455');
