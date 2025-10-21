-- Cập nhật enum order_status để thêm trạng thái 'ordering'
-- Chạy script này trên Supabase SQL Editor

-- Bước 1: Thêm giá trị mới vào enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ordering';

-- Bước 2: Cập nhật các đơn hàng hiện tại
-- Sau khi tạo đơn: status = 'ordering' (Đã đặt đơn, chưa lấy sách)
-- Sau khi "Tiến hành lấy sách": status = 'pending' (Đang mượn)
-- Sau khi trả hết sách: status = 'completed' (Đã hoàn thành)

-- Cập nhật trigger để tự động set status = 'ordering' khi tạo đơn mới
CREATE OR REPLACE FUNCTION fn_set_ordering_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Khi tạo order mới, set status = 'ordering'
  IF NEW.status IS NULL THEN
    NEW.status := 'ordering';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_ordering_status ON orders;
CREATE TRIGGER trg_set_ordering_status
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION fn_set_ordering_status();

-- Kiểm tra
SELECT DISTINCT status FROM orders;

-- Giải thích các trạng thái:
-- 'ordering' - Đã đặt đơn (vừa tạo, chưa "Tiến hành lấy sách")
-- 'pending' - Đang mượn (đã gửi JSON thành công, robot đã/đang lấy sách)
-- 'completed' - Đã hoàn thành (đã trả hết sách)
