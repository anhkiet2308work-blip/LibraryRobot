# ⚠️ THAY ĐỔI NGHIỆP VỤ - CẬP NHẬT QUAN TRỌNG

## 📋 Thay đổi

### ❌ Nghiệp vụ CŨ (đã bỏ):
```
1. User tạo order → KHÔNG trừ book_lefts
2. Robot mượn sách → TRỪ book_lefts
3. Robot trả sách → CỘNG book_lefts
```

### ✅ Nghiệp vụ MỚI (hiện tại):
```
1. User tạo order → ✅ TRỪ NGAY book_lefts
2. Robot mượn sách → Chỉ xác nhận (không trừ nữa)
3. Robot trả sách → CỘNG book_lefts
```

---

## 🔄 Quy trình mới

### 1. User tạo đơn hàng
```
User chọn sách → Thêm vào giỏ → Tạo đơn hàng
↓
Backend: POST /api/orders
↓
✅ INSERT order + order_detail
✅ UPDATE book SET book_lefts = book_lefts - 1 (NGAY LẬP TỨC)
↓
Frontend: Reload danh sách sách (book_lefts đã giảm)
```

### 2. Robot mượn sách (chỉ xác nhận)
```
User đến Robot → Nhập Order ID → Quét RFID
↓
Backend: POST /api/robot/borrow
↓
⚠️ KHÔNG trừ book_lefts (đã trừ khi tạo order)
✅ Chỉ xác nhận Robot đã xuất sách
```

### 3. Robot trả sách
```
User đến Robot → Nhập Order ID → Quét RFID
↓
Backend: POST /api/robot/return
↓
✅ UPDATE order_detail SET return_timestamp = NOW()
✅ UPDATE book SET book_lefts = book_lefts + 1
✅ Auto complete nếu trả hết
```

---

## 🔧 Files đã thay đổi

### 1. `/pages/api/orders/index.js`
**Thêm logic trừ book_lefts:**
```javascript
// ✅ TRỪ book_lefts NGAY KHI TẠO ĐơN HÀNG
for (const rfid of bookRfids) {
  const { data: book } = await supabase
    .from('book')
    .select('book_lefts')
    .eq('rfid', rfid)
    .single()

  if (book && book.book_lefts > 0) {
    await supabase
      .from('book')
      .update({ book_lefts: book.book_lefts - 1 })
      .eq('rfid', rfid)
  }
}
```

### 2. `/pages/api/robot/borrow.js`
**Bỏ logic trừ book_lefts:**
```javascript
// ⚠️ NOTE: book_lefts đã được trừ khi tạo order
// Endpoint này chỉ để Robot xác nhận đã xuất sách
// Không cần trừ book_lefts nữa
```

### 3. `/pages/user.js`
**Reload books sau khi tạo order:**
```javascript
// ✅ Reload books để cập nhật book_lefts
const booksData = await getAvailableBooks()
setBooks(booksData)
```

---

## 📊 So sánh trước/sau

### Trước:
| Bước | book_lefts |
|------|-----------|
| Ban đầu | 5 |
| Tạo order | 5 (không đổi) |
| Robot mượn | 4 (trừ 1) |
| Robot trả | 5 (cộng 1) |

### Sau:
| Bước | book_lefts |
|------|-----------|
| Ban đầu | 5 |
| Tạo order | 4 ✅ (trừ ngay 1) |
| Robot mượn | 4 (không đổi) |
| Robot trả | 5 (cộng 1) |

---

## ✅ Lợi ích

1. **Ngăn overbooking**: Khi user tạo order, sách đã reserved ngay
2. **Hiển thị chính xác**: book_lefts cập nhật ngay lập tức
3. **UX tốt hơn**: User thấy số lượng giảm ngay khi đặt
4. **Đơn giản**: Robot chỉ cần xác nhận, không cần logic phức tạp

---

## ⚠️ Lưu ý

### Rollback khi có lỗi:
- Nếu trừ book_lefts thất bại → Xóa order đã tạo
- Đảm bảo data consistency

### Validation:
- Vẫn validate book_lefts > 0 khi tạo order
- Vẫn check RFID hợp lệ

### Hủy order:
- Nếu user hủy order (tính năng tương lai) → Cần CỘNG lại book_lefts

---

## 🧪 Test Cases Mới

### Test 1: Tạo order giảm book_lefts
```
1. Check book RFID001: book_lefts = 5
2. User tạo order với RFID001
3. ✅ Check DB: book_lefts = 4 (giảm ngay)
4. ✅ Reload UI: Hiển thị book_lefts = 4
```

### Test 2: Không đủ sách
```
1. Book RFID002: book_lefts = 1
2. User A tạo order với RFID002 → Success (book_lefts = 0)
3. User B tạo order với RFID002 → ❌ Lỗi "Sách đã hết"
```

### Test 3: Robot chỉ xác nhận
```
1. Tạo order → book_lefts giảm
2. Robot borrow → book_lefts KHÔNG đổi
3. Robot return → book_lefts tăng
```

---

## 📝 Documentation cần update

- [ ] README.md
- [ ] API_DOCUMENTATION.md
- [ ] BACKEND_COMPLETED.md
- [x] BUSINESS_LOGIC_CHANGE.md (file này)

---

**Ngày thay đổi**: October 18, 2025  
**Lý do**: Cập nhật book_lefts ngay khi tạo order để hiển thị chính xác  
**Status**: ✅ Implemented & Working
