-- =====================================================
-- FIX TRIGGER: Loại bỏ INSERT event khỏi trigger
-- =====================================================
-- Vấn đề: Trigger trg_orders_autocomplete hiện tại chạy trên
--         AFTER INSERT OR UPDATE OR DELETE. Khi tạo order mới,
--         app insert order (status='ordering') rồi insert order_detail.
--         Trigger chạy trên INSERT order_detail → set status='pending' ngay lập tức.
--
-- Giải pháp: Chỉ cho trigger chạy trên UPDATE OR DELETE (không chạy INSERT).
--            Khi user tạo order → status = 'ordering' (DB default)
--            Khi robot borrow thành công → API update status = 'pending'
--            Khi trả sách → trigger update status = 'completed'
-- =====================================================

-- BƯỚC 1: Kiểm tra trigger hiện tại
SELECT 
  tgname as trigger_name,
  tgisinternal as is_internal,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'order_detail'::regclass
  AND NOT tgisinternal;

-- BƯỚC 2: Drop trigger hiện tại (nếu tồn tại)
DROP TRIGGER IF EXISTS trg_orders_autocomplete ON public.order_detail;

-- BƯỚC 3: Recreate trigger - CHỈ chạy trên UPDATE và DELETE (KHÔNG INSERT)
CREATE TRIGGER trg_orders_autocomplete
AFTER UPDATE OR DELETE ON public.order_detail
FOR EACH ROW
EXECUTE FUNCTION fn_orders_autocomplete();

-- BƯỚC 4: Verify trigger mới
SELECT 
  tgname as trigger_name,
  tgisinternal as is_internal,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'order_detail'::regclass
  AND NOT tgisinternal;

-- BƯỚC 5: Test behavior (Optional - chạy nếu muốn test ngay)
-- Uncomment các dòng dưới để test:

-- DO $$
-- DECLARE
--   test_user_id BIGINT;
--   test_order_id BIGINT;
-- BEGIN
--   -- Lấy user_id đầu tiên để test
--   SELECT user_id INTO test_user_id FROM users LIMIT 1;
--   
--   -- Tạo order mới (không set status - dùng default)
--   INSERT INTO orders (user_id) 
--   VALUES (test_user_id) 
--   RETURNING order_id INTO test_order_id;
--   
--   RAISE NOTICE 'Created test order_id: %', test_order_id;
--   
--   -- Kiểm tra status TRƯỚC khi insert order_detail
--   PERFORM pg_sleep(0.1);
--   RAISE NOTICE 'Status after order insert: %', 
--     (SELECT status FROM orders WHERE order_id = test_order_id);
--   
--   -- Insert order_detail (giống như app làm)
--   INSERT INTO order_detail (order_id, rfid, return_timestamp)
--   SELECT test_order_id, rfid, NULL
--   FROM book
--   WHERE book_lefts > 0
--   LIMIT 1;
--   
--   -- Kiểm tra status SAU khi insert order_detail
--   PERFORM pg_sleep(0.1);
--   RAISE NOTICE 'Status after order_detail insert: %', 
--     (SELECT status FROM orders WHERE order_id = test_order_id);
--   
--   -- Cleanup: Xóa test data
--   DELETE FROM orders WHERE order_id = test_order_id;
--   
--   RAISE NOTICE '✅ Test completed and cleaned up';
-- END $$;

-- =====================================================
-- KẾT QUẢ MONG ĐỢI:
-- =====================================================
-- Trigger definition sẽ hiển thị:
--   AFTER UPDATE OR DELETE (KHÔNG có INSERT)
--
-- Sau khi chạy script này:
-- 1. Tạo order mới qua app → status = 'ordering' ✅
-- 2. Gọi /api/robot/borrow (serial success) → status = 'pending' ✅
-- 3. Trả hết sách → trigger tự động → status = 'completed' ✅
-- =====================================================

SELECT '✅ Trigger đã được cập nhật thành công!' as message;
SELECT '📝 Vui lòng test tạo order mới qua app để verify' as next_step;
