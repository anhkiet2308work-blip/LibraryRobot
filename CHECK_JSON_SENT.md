# Hướng dẫn kiểm tra JSON đã gửi thành công

## 🔍 Cách kiểm tra log khi gửi JSON đến Robot

### 1. **Mở Developer Console (F12)**

Khi thực hiện thao tác mượn/trả sách, mở Developer Console để xem log chi tiết:

#### **Chế độ Mượn Sách (Borrow)**

Khi nhấn nút **"🤖 Tiến hành lấy sách"**, console sẽ hiển thị:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 BƯỚC 1: Chuẩn bị gửi lệnh lấy sách
   Đơn hàng: #30
   Số lượng sách: 3
   Danh sách: Book Title 5 (2514432167), Book Title 6 (2516072455), Book Title 7 (2516072455)
✅ BƯỚC 2: Robot đã nhận JSON
   Success: true
   Message: Đã gửi 3 vị trí sách đến Robot
   JSON Payload:
   {
     "action": "borrow",
     "timestamp": "2025-10-20T15:22:58.000Z",
     "books": [
       {
         "sequence": 1,
         "rfid": "2514432167",
         "name": "Book Title 5",
         "position": {
           "x": 10.5,
           "y": 20.3,
           "z": 5.1
         }
       },
       ...
     ]
   }
   Serial Result: {success: true, data: "..."}
✅ BƯỚC 3: Cập nhật trạng thái đơn hàng
   Status Change: pending → borrowing
   Message: Đã chuyển sang trạng thái "Đang mượn" cho 3 sách
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### **Chế độ Trả Sách (Return)**

Sau khi quét RFID và nhấn **"Xác nhận trả"**, console sẽ hiển thị:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 BƯỚC 1: Chuẩn bị trả sách
   Đơn hàng: #30
   Số lượng: 3
   Thứ tự quét: 2516072455, 2514432167, 2516072455
✅ BƯỚC 2: Đã cập nhật database
📡 BƯỚC 3: Gửi JSON đến robot theo thứ tự quét
   1. Book Title 6 → X=11.2, Y=21.5, Z=6.3
   2. Book Title 5 → X=10.5, Y=20.3, Z=5.1
   3. Book Title 7 → X=12.8, Y=23.1, Z=7.2
✅ BƯỚC 4: Robot đã nhận JSON
   Success: true
   Message: Đã gửi 3 vị trí sách đến Robot
   JSON Payload:
   {
     "action": "return",
     "timestamp": "2025-10-20T15:25:30.000Z",
     "books": [
       {
         "sequence": 1,
         "rfid": "2516072455",
         "name": "Book Title 6",
         "position": {"x": 11.2, "y": 21.5, "z": 6.3}
       },
       ...
     ]
   }
   Serial Result: {success: true, mock: true, data: {...}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. **Kiểm tra trạng thái đơn hàng**

#### **Trạng thái mới:**

| Status | Tên hiển thị | Ý nghĩa |
|--------|--------------|---------|
| `pending` | 📝 Đã ghi nhận đơn | Đơn vừa tạo, chưa "Tiến hành lấy sách" |
| `borrowing` | 📖 Đang mượn | Đã gửi JSON lấy sách, robot đang/đã lấy sách |
| `completed` | ✓ Đã hoàn thành | Đã trả hết sách |

#### **Luồng chuyển trạng thái:**

```
1. Tạo đơn hàng → status = 'pending' (📝 Đã ghi nhận đơn)
2. Robot > Mượn sách > "Tiến hành lấy sách" → status = 'borrowing' (📖 Đang mượn)
3. Robot > Trả sách > Quét RFID > "Xác nhận trả" → status = 'completed' nếu trả hết
```

---

### 3. **Kiểm tra trên Serial Port**

#### **A. Sử dụng HHD Virtual Serial Port Tools**

1. Tạo cặp port ảo: **COM1 ↔ COM2**
2. App gửi vào **COM1**
3. Mở **Serial Monitor** để đọc từ **COM2**:

**PuTTY:**
- Connection Type: Serial
- Serial line: COM2
- Speed: 9600
- Click "Open"

**Kết quả khi "Tiến hành lấy sách":**
```json
{"action":"borrow","timestamp":"2025-10-20T15:22:58.000Z","books":[{"sequence":1,"rfid":"2514432167","name":"Book Title 5","position":{"x":10.5,"y":20.3,"z":5.1}},{"sequence":2,"rfid":"2516072455","name":"Book Title 6","position":{"x":11.2,"y":21.5,"z":6.3}},{"sequence":3,"rfid":"2516072455","name":"Book Title 7","position":{"x":12.8,"y":23.1,"z":7.2}}]}
```

#### **B. Sử dụng Node.js monitor script**

Tạo file `monitor-serial.js`:

```javascript
const { SerialPort } = require('serialport')
const port = new SerialPort({ path: 'COM2', baudRate: 9600 })

console.log('🎧 Đang lắng nghe trên COM2...\n')

port.on('data', (data) => {
  const str = data.toString()
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📥 Nhận được dữ liệu:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  try {
    const json = JSON.parse(str)
    console.log('✅ JSON hợp lệ:')
    console.log(JSON.stringify(json, null, 2))
    
    console.log('\n📊 Tóm tắt:')
    console.log(`   Action: ${json.action}`)
    console.log(`   Timestamp: ${json.timestamp}`)
    console.log(`   Books: ${json.books.length}`)
    json.books.forEach((book, i) => {
      console.log(`   ${i+1}. ${book.name} (${book.rfid})`)
      console.log(`      → X=${book.position.x}, Y=${book.position.y}, Z=${book.position.z}`)
    })
  } catch (err) {
    console.log('❌ Không phải JSON:')
    console.log(str)
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
})

port.on('error', (err) => {
  console.error('❌ Lỗi serial port:', err.message)
})
```

Chạy:
```bash
node monitor-serial.js
```

---

### 4. **Kiểm tra server-side log (Terminal)**

Khi chạy `npm run dev`, server sẽ log:

**API `/api/robot/command` (gửi JSON):**
```
📡 Chuẩn bị gửi đến Robot: {action: "borrow", ...}
✅ Serial port COM1 đã kết nối (9600 baud)
✅ Đã gửi dữ liệu: {"action":"borrow",...}
```

**API `/api/robot/borrow` (cập nhật status):**
```
📦 Borrow Request: { orderId: 30, jsonSent: true }
✅ Order status updated: pending → borrowing
📡 JSON sent to robot: YES
✅ Borrow completed for order: 30
```

---

### 5. **Toast notification trên UI**

#### **Mượn sách:**
```
✅ Hoàn tất!
📡 Đã gửi 3 vị trí sách đến Robot
📝 Đơn hàng chuyển sang "Đang mượn"
```

#### **Trả sách:**
```
✅ Hoàn tất!
📥 Đã trả 3 sách
📡 Đã gửi vị trí đến Robot theo thứ tự quét
```

---

### 6. **Checklist kiểm tra thành công**

- [ ] Browser Console hiển thị log 3 bước đầy đủ
- [ ] Thấy JSON payload chi tiết với đúng `action`, `books`, `position`
- [ ] Serial monitor (PuTTY/Node.js) nhận được JSON
- [ ] Trạng thái đơn hàng thay đổi: `pending` → `borrowing` (hoặc `completed`)
- [ ] Toast notification hiển thị thành công
- [ ] Server terminal log không có lỗi

---

### 7. **Troubleshooting**

#### **Không thấy log trên console?**
- Kiểm tra đã mở Developer Console (F12) chưa
- Refresh lại trang và thử lại

#### **Serial port không nhận được dữ liệu?**
- Kiểm tra COM port có đúng không (COM1 vs COM2)
- Kiểm tra baud rate khớp (9600)
- Đảm bảo port ảo đã được tạo bằng HHD hoặc com0com

#### **Status không đổi từ pending sang borrowing?**
- Kiểm tra đã chạy SQL script `add_order_status.sql` chưa
- Xem server log có lỗi không

#### **Mock mode - không có serial port thật?**
Nếu log hiển thị:
```
Serial Result: {success: true, mock: true, data: {...}}
```
Có nghĩa là đang chạy mock mode (không có serial port thật). Đây là OK để test logic!

---

### 8. **Video Demo (Tự ghi lại)**

1. Mở browser + Developer Console
2. Vào `/robot` > Chọn "Mượn sách"
3. Nhập mã đơn hàng
4. Nhấn "Tiến hành lấy sách"
5. **Screen record** browser console + serial monitor cùng lúc
6. Quan sát JSON được gửi ở cả 2 nơi

---

## 📌 Tóm tắt

✅ **Console log**: Browser F12 > Console tab  
✅ **Serial monitor**: PuTTY hoặc Node.js script  
✅ **Server log**: Terminal chạy `npm run dev`  
✅ **UI notification**: Toast message  
✅ **Database**: Trạng thái đơn hàng đổi từ `pending` → `borrowing` → `completed`  

Nếu tất cả đều OK → **JSON đã gửi thành công!** 🎉
