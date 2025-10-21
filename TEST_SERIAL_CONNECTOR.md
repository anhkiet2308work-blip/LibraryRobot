# ✅ CHECKLIST TEST - Module SerialConnector

## 🎯 Test ngay bây giờ

### ✅ Test 1: Kết nối lần đầu (1 phút)
```
1. Mở http://localhost:3000/robot
2. Chọn COM5 trong dropdown
3. Click "🔌 Kết Nối"
4. ✅ Nên hiển thị: "🟢 Đã kết nối COM5"
5. Check terminal → Nên thấy:
   🔌 Opening port: COM5
   ✅ Port opened successfully
```

**Nếu lỗi "Access denied"**: 
- Đóng Arduino IDE / PuTTY / Serial Monitor
- Click "Force Cleanup", chờ 5s, thử lại

---

### ✅ Test 2: Ngắt kết nối và mở lại (2 phút)
```
1. (Từ Test 1, port đang kết nối)
2. Click "🔌 Ngắt kết nối"
3. ✅ Nên hiển thị: "⚪ Chưa kết nối"
4. Chờ 2 giây
5. Click "🔌 Kết Nối" lại
6. ✅ Nên kết nối thành công KHÔNG cần rút USB
7. Check terminal → Nên thấy:
   🔌 Closing port: COM5
   ✅ Port closed
   (delay 300ms)
   🔌 Opening port: COM5
   ✅ Port opened successfully
```

**Nếu lỗi**: 
- Module sẽ retry 5 lần tự động
- Nếu vẫn fail → Force Cleanup

---

### ✅ Test 3: Gửi dữ liệu (3 phút)
```
1. Kết nối COM5
2. Quét RFID hoặc nhập mã sách
3. Click "Tiến hành lấy sách"
4. ✅ Arduino nên nhận được JSON
5. Check terminal → Nên thấy:
   📡 Robot Command
      Action: borrow
      Port: COM5
      Books: 1
   ✅ Data sent to COM5
```

**Nếu Arduino không nhận**:
- Check baud rate = 9600
- Check Arduino đang chạy sketch nhận Serial
- Đóng Serial Monitor Arduino (conflict)

---

### ✅ Test 4: Chuyển trang (1 phút)
```
1. Kết nối COM5 ở trang /robot
2. Click "Quay lại trang chủ" → /
3. Click "Robot" → /robot
4. ✅ Nên vẫn hiển thị: "🟢 Đã kết nối COM5"
5. Thử gửi lệnh → Nên hoạt động bình thường
```

**Lưu ý**: Connection được giữ bằng Zustand store

---

### ✅ Test 5: Force Cleanup (chỉ khi cần)
```
1. Nếu gặp lỗi "Access denied" không tự hồi phục
2. Click "🧹 Force Cleanup"
3. Confirm "OK"
4. Chờ 2 giây
5. Click "🔌 Kết Nối" lại
6. ✅ Nên thành công
```

---

## 📋 Tóm tắt kết quả mong đợi

| Test | Kết quả mong đợi | Thời gian |
|------|------------------|-----------|
| 1. Kết nối lần đầu | ✅ Thành công ngay | 1 phút |
| 2. Ngắt → Kết nối lại | ✅ Không cần rút USB | 2 phút |
| 3. Gửi dữ liệu | ✅ Arduino nhận JSON | 3 phút |
| 4. Chuyển trang | ✅ Connection giữ nguyên | 1 phút |
| 5. Force Cleanup | ✅ Fix lỗi stuck | (nếu cần) |

**Tổng thời gian test**: ~7 phút

---

## 🐛 Nếu gặp lỗi

### "Access denied"
1. Đóng Arduino IDE / Serial Monitor
2. Force Cleanup → Chờ 5s → Kết nối lại
3. Rút USB → Chờ 5s → Cắm lại
4. Thử port khác (COM3, COM4, ...)

### "Port not found"
1. Check USB đã cắm chưa
2. Check Device Manager → Ports (COM & LPT)
3. Thử rút cắm lại USB

### "Robot chưa kết nối"
1. Click "🔌 Kết Nối" trước
2. Chờ hiển thị "🟢 Đã kết nối"
3. Mới gửi lệnh

---

## 📊 Log terminal mẫu (THÀNH CÔNG)

```
🔌 Opening port: COM5
   Baud: 9600
   Data: 8 bits
   Parity: none
   Stop: 1 bits
   Verifying port exists...
   Attempt 1/5...
   Setting DTR/RTS = false...
   Flushing buffers...
✅ Port opened successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Robot Command
   Action: borrow
   Port: COM5
   Books: 1
   Payload: {
     "action": "borrow",
     "timestamp": "2025-01-21T...",
     "books": [...]
   }
✅ Data sent to COM5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Closing port: COM5
   Stopping readers...
   Releasing DTR/RTS...
   Flushing buffers...
   Closing...
   Waiting 300ms for OS to release handle...
✅ Port closed: COM5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 Log terminal mẫu (LỖI → RETRY → THÀNH CÔNG)

```
🔌 Opening port: COM5
   Baud: 9600
   Verifying port exists...
   Attempt 1/5...
   ⚠️ Attempt 1 failed: Access denied
   Retrying in 100ms...
   Attempt 2/5...
   ⚠️ Attempt 2 failed: Access denied
   Retrying in 200ms...
   Attempt 3/5...
   Setting DTR/RTS = false...
   Flushing buffers...
✅ Port opened successfully
```

**→ Retry thành công ở lần thứ 3!**

---

## ✅ Checklist hoàn tất

- [ ] Test 1: Kết nối lần đầu
- [ ] Test 2: Ngắt → Kết nối lại
- [ ] Test 3: Gửi dữ liệu
- [ ] Test 4: Chuyển trang
- [ ] Test 5: Force Cleanup (nếu cần)

**Sau khi test xong, báo kết quả:**
- ✅ "Tất cả tests PASS" → Hoàn tất!
- ⚠️ "Test X fail" → Gửi log terminal để debug

---

**Ready to test!** 🚀
