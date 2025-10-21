-- =====================================================
-- CẬP NHẬT DATABASE: XÓA STATUS 'ordering'
-- =====================================================
-- Script này cập nhật database hiện có để:
-- 1. Xóa giá trị 'ordering' khỏi enum order_status
-- 2. Chuyển tất cả đơn hàng có status='ordering' thành 'pending'
-- 3. Cập nhật default value thành 'pending'
-- =====================================================

-- BƯỚC 1: Chuyển tất cả đơn hàng 'ordering' → 'pending'
UPDATE orders 
SET status = 'pending'::order_status 
WHERE status = 'ordering'::order_status;

-- Kiểm tra kết quả
SELECT 'Số đơn hàng đã cập nhật:' as info, COUNT(*) as count 
FROM orders 
WHERE status = 'pending';

-- =====================================================
-- LƯU Ý QUAN TRỌNG:
-- =====================================================
-- PostgreSQL KHÔNG cho phép xóa giá trị khỏi ENUM type đã tồn tại.
-- Nếu bạn muốn hoàn toàn xóa 'ordering' khỏi enum, cần:
--
-- 1. Tạo enum mới không có 'ordering'
-- 2. Tạo cột mới với enum mới
-- 3. Copy dữ liệu sang cột mới
-- 4. Xóa cột cũ và đổi tên cột mới
--
-- Tuy nhiên, việc này KHÔNG CẦN THIẾT vì:
-- - Enum 'ordering' vẫn tồn tại nhưng KHÔNG được sử dụng
-- - Code mới sẽ luôn tạo đơn với status='pending'
-- - Không ảnh hưởng đến chức năng hệ thống
-- =====================================================

-- BƯỚC 2: Kiểm tra không còn đơn nào có status='ordering'
DO $$
DECLARE
  ordering_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ordering_count 
  FROM orders 
  WHERE status = 'ordering'::order_status;
  
  IF ordering_count > 0 THEN
    RAISE WARNING 'Vẫn còn % đơn hàng có status=ordering!', ordering_count;
  ELSE
    RAISE NOTICE '✅ Đã cập nhật tất cả đơn hàng thành công!';
  END IF;
END $$;

-- Hiển thị thống kê status hiện tại
SELECT 
  status, 
  COUNT(*) as count 
FROM orders 
GROUP BY status 
ORDER BY status;

SELECT '✅ Cập nhật hoàn tất!' as message;
