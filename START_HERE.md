# 🚀 QUICK START - 3 BƯỚC

## Bước 1: Setup Database (2 phút)
1. Truy cập: https://supabase.com/dashboard/project/swtrsshxprlbimexurms/sql
2. Copy toàn bộ file `database/setup.sql`
3. Paste và click **RUN**
4. ✅ Done! Database ready với demo data

## Bước 2: Start Server (đã xong)
```bash
# Server đang chạy tại http://localhost:3000
# Nếu chưa chạy:
npm run dev
```

## Bước 3: Login & Test

### 🔑 Đăng nhập
- **Admin**: admin@library.com / admin123
- **User**: user1@library.com / user123
- **Robot**: Không cần login

### ✅ Test Flow Nhanh
1. Login với user1
2. Thêm 2-3 sách vào giỏ
3. Tạo đơn hàng → Ghi nhớ Order ID (ví dụ: #1)
4. Logout → Click "Giao diện Robot"
5. Chọn "Mượn sách" → Nhập Order ID
6. Quét RFID: RFID001, RFID002 → Xác nhận
7. Chọn "Trả sách" → Nhập Order ID
8. Quét RFID: RFID001, RFID002 → Xác nhận
9. ✅ Order tự động complete!

---

## 📚 Tài Liệu

- **README.md** - Đọc đầu tiên
- **QUICKSTART.md** - Hướng dẫn chi tiết
- **API_DOCUMENTATION.md** - API docs
- **PROJECT_SUMMARY.md** - Tổng kết project

---

## 🎯 Nghiệp Vụ Quan Trọng

### ✅ ĐÚNG:
1. User tạo order → **KHÔNG trừ** book_lefts
2. Robot mượn → **TRỪ** book_lefts
3. Robot trả → **CỘNG** book_lefts + auto complete

### ❌ SAI (đã fix):
1. ~~Tạo order → trừ ngay~~ ❌

---

## 🆘 Troubleshooting

**Lỗi kết nối database?**
→ Check `.env.local` có đúng URL và API Key

**Port 3000 bận?**
→ `npm run dev -- -p 3001`

**Không thấy data?**
→ Chạy lại `database/setup.sql`

---

**Ready to go! 🎉**
