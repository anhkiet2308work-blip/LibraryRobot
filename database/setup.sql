-- =====================================================
-- LIBRARY ROBOT DATABASE SETUP SCRIPT
-- Chạy script này trên Supabase SQL Editor
-- =====================================================

-- Cleanup an toàn khi chạy lại
DO $$
BEGIN
  IF to_regclass('public.order_detail') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_orders_autocomplete ON public.order_detail;
  END IF;
END$$;

DROP FUNCTION IF EXISTS fn_orders_autocomplete();
DROP TABLE IF EXISTS order_detail;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS order_status;

-- Tạo kiểu ENUM trạng thái đơn hàng
CREATE TYPE order_status AS ENUM ('pending', 'completed');

-- Extension cho email không phân biệt hoa thường
CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================================
-- BẢNG USERS
-- =====================================================
CREATE TABLE users (
  user_id     BIGSERIAL PRIMARY KEY,
  email       CITEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin','user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- BẢNG BOOK
-- =====================================================
CREATE TABLE book (
  rfid        VARCHAR(64) PRIMARY KEY,
  name        TEXT NOT NULL,
  book_lefts  INTEGER NOT NULL DEFAULT 0 CHECK (book_lefts >= 0),
  position_x  NUMERIC(10,2),
  position_y  NUMERIC(10,2),
  position_z  NUMERIC(10,2)
);

-- =====================================================
-- BẢNG ORDERS
-- =====================================================
CREATE TABLE orders (
  order_id    BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(user_id)
               ON UPDATE CASCADE ON DELETE RESTRICT,
  ts_created  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status      order_status NOT NULL DEFAULT 'pending'
);

-- =====================================================
-- BẢNG ORDER_DETAIL
-- =====================================================
CREATE TABLE order_detail (
  order_id          BIGINT NOT NULL REFERENCES orders(order_id)
                      ON UPDATE CASCADE ON DELETE CASCADE,
  rfid              VARCHAR(64) NOT NULL REFERENCES book(rfid)
                      ON UPDATE CASCADE ON DELETE RESTRICT,
  return_timestamp  TIMESTAMPTZ NULL,
  PRIMARY KEY (order_id, rfid)
);

-- Tạo index để tăng hiệu suất truy vấn
CREATE INDEX idx_order_detail_order_id ON order_detail(order_id);
CREATE INDEX idx_order_detail_return_ts_null
  ON order_detail(order_id) WHERE return_timestamp IS NULL;

-- =====================================================
-- TRIGGER FUNCTION: Tự động cập nhật trạng thái đơn hàng
-- =====================================================
CREATE OR REPLACE FUNCTION fn_orders_autocomplete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id BIGINT;
  v_all_returned BOOLEAN;
BEGIN
  v_order_id := COALESCE(NEW.order_id, OLD.order_id);

  -- Kiểm tra xem tất cả sách đã được trả chưa
  SELECT NOT EXISTS (
    SELECT 1 FROM order_detail od
    WHERE od.order_id = v_order_id
      AND od.return_timestamp IS NULL
  )
  INTO v_all_returned;

  -- Cập nhật trạng thái đơn hàng
  IF v_all_returned THEN
    UPDATE orders
      SET status = 'completed'
    WHERE order_id = v_order_id
      AND status <> 'completed';
  ELSE
    UPDATE orders
      SET status = 'pending'
    WHERE order_id = v_order_id
      AND status <> 'pending';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- TRIGGER: Tự động cập nhật trạng thái đơn hàng
-- =====================================================
CREATE TRIGGER trg_orders_autocomplete
AFTER INSERT OR UPDATE OR DELETE ON order_detail
FOR EACH ROW
EXECUTE FUNCTION fn_orders_autocomplete();

-- =====================================================
-- DỮ LIỆU DEMO
-- =====================================================

-- Tạo tài khoản Admin
INSERT INTO users (email, password, role) VALUES
('admin@library.com', 'admin123', 'admin');

-- Tạo tài khoản User demo
INSERT INTO users (email, password, role) VALUES
('user1@library.com', 'user123', 'user'),
('user2@library.com', 'user123', 'user');

-- Thêm sách demo
INSERT INTO book (rfid, name, book_lefts, position_x, position_y, position_z) VALUES
('RFID001', 'Lập trình JavaScript cơ bản', 5, 1.0, 1.0, 1.0),
('RFID002', 'React cho người mới bắt đầu', 3, 1.0, 1.5, 1.0),
('RFID003', 'Next.js Advanced', 4, 1.0, 2.0, 1.0),
('RFID004', 'Node.js và Express', 6, 2.0, 1.0, 1.0),
('RFID005', 'TypeScript Handbook', 2, 2.0, 1.5, 1.0),
('RFID006', 'Database Design', 4, 2.0, 2.0, 1.0),
('RFID007', 'REST API Best Practices', 3, 3.0, 1.0, 1.0),
('RFID008', 'GraphQL cho người mới', 5, 3.0, 1.5, 1.0),
('RFID009', 'Docker và Kubernetes', 2, 3.0, 2.0, 1.0),
('RFID010', 'Clean Code', 7, 1.0, 1.0, 2.0);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Kiểm tra số lượng records
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Books', COUNT(*) FROM book
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Details', COUNT(*) FROM order_detail;

-- Hiển thị thông tin
SELECT 'Setup completed successfully!' as status;
SELECT 'Admin login: admin@library.com / admin123' as info
UNION ALL
SELECT 'User login: user1@library.com / user123';
