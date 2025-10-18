-- Stored procedures cho thống kê

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
