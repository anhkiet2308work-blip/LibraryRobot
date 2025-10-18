# Hướng dẫn cài đặt Stored Procedures cho Thống kê

## Bước 1: Truy cập Supabase SQL Editor

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** từ menu bên trái

## Bước 2: Chạy các Stored Procedures

Copy và chạy nội dung file `database/statistics_functions.sql`:

```sql
-- 1. Thống kê mượn sách theo tháng của user
CREATE OR REPLACE FUNCTION get_user_monthly_borrowing(p_user_id VARCHAR)
RETURNS TABLE(month INTEGER, year INTEGER, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM o.ts_created)::INTEGER as month,
    EXTRACT(YEAR FROM o.ts_created)::INTEGER as year,
    COUNT(DISTINCT o.order_id) as count
  FROM orders o
  WHERE o.user_id = p_user_id
    AND o.ts_created >= NOW() - INTERVAL '12 months'
  GROUP BY EXTRACT(YEAR FROM o.ts_created), EXTRACT(MONTH FROM o.ts_created)
  ORDER BY year DESC, month DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Thống kê tình trạng trả sách của user
CREATE OR REPLACE FUNCTION get_user_return_status(p_user_id VARCHAR)
RETURNS TABLE(status VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN od.return_timestamp IS NULL THEN 'Chưa trả'
      ELSE 'Đã trả'
    END as status,
    COUNT(*) as count
  FROM orders o
  JOIN order_detail od ON o.order_id = od.order_id
  WHERE o.user_id = p_user_id
  GROUP BY (od.return_timestamp IS NULL);
END;
$$ LANGUAGE plpgsql;

-- 3. Thống kê mượn sách theo tháng (toàn hệ thống - admin)
CREATE OR REPLACE FUNCTION get_admin_monthly_borrowing()
RETURNS TABLE(month INTEGER, year INTEGER, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM o.ts_created)::INTEGER as month,
    EXTRACT(YEAR FROM o.ts_created)::INTEGER as year,
    COUNT(DISTINCT o.order_id) as count
  FROM orders o
  WHERE o.ts_created >= NOW() - INTERVAL '12 months'
  GROUP BY EXTRACT(YEAR FROM o.ts_created), EXTRACT(MONTH FROM o.ts_created)
  ORDER BY year DESC, month DESC;
END;
$$ LANGUAGE plpgsql;

-- 4. Thống kê tình trạng trả sách (toàn hệ thống - admin)
CREATE OR REPLACE FUNCTION get_admin_return_status()
RETURNS TABLE(status VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN od.return_timestamp IS NULL THEN 'Chưa trả'
      ELSE 'Đã trả'
    END as status,
    COUNT(*) as count
  FROM order_detail od
  GROUP BY (od.return_timestamp IS NULL);
END;
$$ LANGUAGE plpgsql;

-- 5. Thống kê tổng quan hệ thống (admin)
CREATE OR REPLACE FUNCTION get_admin_overview()
RETURNS TABLE(
  total_users BIGINT,
  total_books BIGINT,
  total_orders BIGINT,
  active_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM "user")::BIGINT as total_users,
    (SELECT COUNT(*) FROM book)::BIGINT as total_books,
    (SELECT COUNT(*) FROM orders)::BIGINT as total_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending')::BIGINT as active_orders;
END;
$$ LANGUAGE plpgsql;
```

## Bước 3: Kiểm tra

Chạy các câu lệnh sau để kiểm tra:

```sql
-- Test user statistics (thay 'user1' bằng user_id thực tế)
SELECT * FROM get_user_monthly_borrowing('user1');
SELECT * FROM get_user_return_status('user1');

-- Test admin statistics
SELECT * FROM get_admin_monthly_borrowing();
SELECT * FROM get_admin_return_status();
SELECT * FROM get_admin_overview();
```

## Bước 4: Test trên Web

1. Khởi động lại Next.js dev server nếu cần
2. Đăng nhập với tài khoản **user**, vào tab **📊 Thống kê**
3. Đăng nhập với tài khoản **admin**, vào tab **📈 Thống kê**

## Lưu ý

- Các stored procedures này sẽ lấy dữ liệu trong **12 tháng gần nhất**
- Biểu đồ sẽ hiển thị "Chưa có dữ liệu" nếu chưa có orders nào trong database
- Để test, hãy tạo một vài orders trước khi xem thống kê
