# Hướng dẫn Test Serial Port với Robot

## 🎯 Quy trình chính xác

### ✅ Chế độ Mượn Sách (KHÔNG CẦN QUÉT RFID)

1. **Vào trang Robot:** http://localhost:3001/robot
2. **Chọn "Mượn Sách"**
3. **Nhập mã đơn hàng** (ví dụ: 1)
4. **Nhấn "Tìm đơn hàng"** → Hiển thị danh sách sách với tọa độ
5. **Nhấn "🤖 Tiến hành lấy sách"** →
   - ✅ Gửi JSON chứa tọa độ TẤT CẢ sách đến robot qua serial port
   - ✅ Cập nhật database thành đã mượn
   - ✅ Hoàn tất và quay về trang chủ
6. **KHÔNG CẦN QUÉT RFID** - Robot tự lấy sách theo tọa độ

### ✅ Chế độ Trả Sách (CẦN QUÉT RFID THEO THỨ TỰ)

1. **Vào trang Robot:** http://localhost:3001/robot
2. **Chọn "Trả Sách"**
3. **Nhập mã đơn hàng** (ví dụ: 1)
4. **Nhấn "Tìm đơn hàng"** → Hiển thị danh sách sách chưa trả
5. **Quét RFID từng sách** theo thứ tự người dùng đưa:
   - Quét sách 1 → ✓ Đã quét
   - Quét sách 2 → ✓ Đã quét
   - Quét sách 3 → ✓ Đã quét
6. **Nhấn "✓ Xác nhận trả"** →
   - ✅ Gửi JSON chứa tọa độ sách THEO THỨ TỰ ĐÃ QUÉT
   - ✅ Cập nhật database
   - ✅ Hoàn tất và quay về trang chủ
7. Robot xếp sách vào vị trí theo thứ tự JSON nhận được

## 📡 JSON được gửi đến Robot

### Mượn sách (Tất cả sách trong đơn):
```json
{
  "action": "borrow",
  "timestamp": "2025-10-19T16:30:00.000Z",
  "books": [
    {
      "sequence": 1,
      "rfid": "2501653831",
      "name": "Book Title 2",
      "position": {"x": 23.1, "y": 27.3, "z": 14.7}
    },
    {
      "sequence": 2,
      "rfid": "2516072455",
      "name": "Book Title 1",
      "position": {"x": 25.3, "y": 29.9, "z": 16.1}
    },
    {
      "sequence": 3,
      "rfid": "2511087895",
      "name": "Book Title 10",
      "position": {"x": 33.0, "y": 39.0, "z": 21.0}
    }
  ]
}
```

### Trả sách (Theo thứ tự quét):
**Ví dụ:** Người dùng quét theo thứ tự: Book 1 → Book 10 → Book 2

```json
{
  "action": "return",
  "timestamp": "2025-10-19T16:35:00.000Z",
  "books": [
    {
      "sequence": 1,
      "rfid": "2516072455",
      "name": "Book Title 1",
      "position": {"x": 25.3, "y": 29.9, "z": 16.1}
    },
    {
      "sequence": 2,
      "rfid": "2511087895",
      "name": "Book Title 10",
      "position": {"x": 33.0, "y": 39.0, "z": 21.0}
    },
    {
      "sequence": 3,
      "rfid": "2501653831",
      "name": "Book Title 2",
      "position": {"x": 23.1, "y": 27.3, "z": 14.7}
    }
  ]
}
```

## 🔍 Debug - Xem Console Log

### Mở Developer Console (F12)

**Khi Mượn sách:**
```
📡 Gửi lệnh lấy sách: [
  {rfid: "2501653831", name: "Book Title 2", position_x: 23.1, ...},
  {rfid: "2516072455", name: "Book Title 1", position_x: 25.3, ...},
  {rfid: "2511087895", name: "Book Title 10", position_x: 33.0, ...}
]
✅ Robot response: {success: true, message: "Đã gửi 3 vị trí sách đến Robot"}
```

**Khi Trả sách:**
```
📡 Gửi lệnh trả sách theo thứ tự quét: [
  {rfid: "2516072455", name: "Book Title 1", position_x: 25.3, ...},
  {rfid: "2511087895", name: "Book Title 10", position_x: 33.0, ...},
  {rfid: "2501653831", name: "Book Title 2", position_x: 23.1, ...}
]
✅ Robot response: {success: true, ...}
```

## 🧪 Test với Serial Port ảo

### Windows - com0com

1. **Download:** https://sourceforge.net/projects/com0com/
2. **Cài đặt** và tạo cặp port: COM1 ↔ COM2
3. **Cấu hình:**
   - App gửi vào **COM1**
   - Dùng PuTTY/SerialMonitor đọc từ **COM2**

### Monitor Serial Port với PuTTY

1. Mở PuTTY
2. Connection Type: **Serial**
3. Serial line: **COM2**
4. Speed: **9600**
5. Click **Open**
6. Thực hiện mượn/trả sách → Xem JSON hiển thị trong PuTTY

### Monitor với Node.js

```javascript
const { SerialPort } = require('serialport')
const port = new SerialPort({ path: 'COM2', baudRate: 9600 })

port.on('data', (data) => {
  console.log('\n📥 Received from Robot App:')
  console.log(data.toString())
  
  try {
    const json = JSON.parse(data.toString())
    console.log('\n✅ Parsed JSON:')
    console.log('Action:', json.action)
    console.log('Books:', json.books.length)
    json.books.forEach((book, i) => {
      console.log(`  ${i+1}. ${book.name} at (${book.position.x}, ${book.position.y}, ${book.position.z})`)
    })
  } catch (e) {
    console.log('⚠️  Not a complete JSON yet')
  }
})

console.log('🎧 Listening on COM2...')
```

## ✅ Checklist Test

### Mượn sách:
- [ ] Tìm đơn hàng thành công
- [ ] Hiển thị đúng danh sách sách với tọa độ
- [ ] Nút "Tiến hành lấy sách" hiển thị
- [ ] Nhấn nút → Gửi JSON thành công
- [ ] Console log hiển thị đầy đủ thông tin
- [ ] Serial monitor (COM2) nhận được JSON
- [ ] Database cập nhật order thành completed
- [ ] Quay về trang chủ tự động

### Trả sách:
- [ ] Tìm đơn hàng thành công
- [ ] Hiển thị đúng sách chưa trả
- [ ] Quét RFID → Hiển thị "✓ Đã quét"
- [ ] Quét đúng thứ tự mong muốn
- [ ] Nhấn "Xác nhận trả" → Gửi JSON
- [ ] JSON có thứ tự khớp với thứ tự quét
- [ ] Serial monitor nhận đúng JSON
- [ ] Database cập nhật return_timestamp
- [ ] Quay về trang chủ

## 🐛 Troubleshooting

### Không thấy JSON trong serial monitor
- ✅ Kiểm tra cặp port đúng (COM1 ↔ COM2)
- ✅ Baud rate khớp (9600)
- ✅ App đang chạy mode không phải mock

### Thứ tự sách khi trả không đúng
- ✅ Quét lại theo đúng thứ tự mong muốn
- ✅ Xem console log để xác nhận sequence

### Lỗi "Port already in use"
```javascript
// Trong lib/serialPort.js, thêm:
await closeSerialPort()
await initSerialPort('COM1')
```

## 📝 Notes

- **Mượn:** 1 bước - Nhấn nút là xong
- **Trả:** 2 bước - Quét RFID rồi nhấn nút
- **Mock mode:** Nếu không có serial port, tự động log ra console
- **Sequence:** Luôn bắt đầu từ 1, tăng dần
- **Position:** Lấy từ database (position_x, position_y, position_z)
