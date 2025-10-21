-- Cập nhật RFID thực tế cho các sách
-- Chạy script này trên Supabase SQL Editor

-- Cập nhật Book Title 1
UPDATE book SET rfid = '2516072455' WHERE rfid = 'RFID001';

-- Cập nhật các sách khác (thay bằng RFID thực tế của bạn)
-- UPDATE book SET rfid = 'YOUR_REAL_RFID_2' WHERE rfid = 'RFID002';
-- UPDATE book SET rfid = 'YOUR_REAL_RFID_3' WHERE rfid = 'RFID003';
-- ...

-- Kiểm tra kết quả
SELECT * FROM book WHERE name LIKE '%Title%';
