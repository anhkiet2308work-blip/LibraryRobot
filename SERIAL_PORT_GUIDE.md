# Tích hợp Serial Port để điều khiển Robot

## Tổng quan

Hệ thống đã được tích hợp serial port để gửi lệnh điều khiển robot lấy/trả sách. Dữ liệu được gửi dưới dạng JSON chứa tọa độ vị trí (X, Y, Z) của các cuốn sách.

## Cấu trúc JSON gửi đến Robot

### 1. Lệnh lấy sách (Borrow)

```json
{
  "action": "borrow",
  "timestamp": "2025-10-19T16:30:00.000Z",
  "books": [
    {
      "sequence": 1,
      "rfid": "2516072455",
      "name": "Book Title 1",
      "position": {
        "x": 25.3,
        "y": 29.9,
        "z": 16.1
      }
    },
    {
      "sequence": 2,
      "rfid": "2501653831",
      "name": "Book Title 2",
      "position": {
        "x": 23.1,
        "y": 27.3,
        "z": 14.7
      }
    }
  ]
}
```

### 2. Lệnh trả sách (Return)

**Đặc biệt**: Thứ tự sách trong JSON khớp với thứ tự RFID được quét!

```json
{
  "action": "return",
  "timestamp": "2025-10-19T16:35:00.000Z",
  "books": [
    {
      "sequence": 1,
      "rfid": "2501653831",
      "name": "Book Title 2",
      "position": {
        "x": 23.1,
        "y": 27.3,
        "z": 14.7
      }
    },
    {
      "sequence": 2,
      "rfid": "2516072455",
      "name": "Book Title 1",
      "position": {
        "x": 25.3,
        "y": 29.9,
        "z": 16.1
      }
    }
  ]
}
```

## Quy trình hoạt động

### Chế độ Mượn Sách (Borrow)

1. **Nhập mã đơn hàng** → Hiển thị danh sách sách
2. **Nhấn "Tiến hành lấy sách"** → 
   - Gửi JSON chứa tọa độ TẤT CẢ sách đến robot qua serial port
   - Cập nhật đơn hàng thành đã mượn
   - **HOÀN TẤT** - Không cần quét RFID
3. Robot tự động lấy sách theo tọa độ nhận được

### Chế độ Trả Sách (Return)

1. **Nhập mã đơn hàng** → Hiển thị danh sách sách
2. **Quét RFID từng sách** theo thứ tự người dùng đưa
3. **Nhấn "Xác nhận trả"** → Tự động gửi tọa độ sách đến robot **THEO THỨ TỰ QUÉT**
4. **Robot xếp sách vào đúng vị trí** theo thứ tự nhận được

## Cấu hình Serial Port

### File: `lib/serialPort.js`

```javascript
// Khởi tạo port
initSerialPort(portName = 'COM1', baudRate = 9600)

// Gửi dữ liệu
sendToSerialPort(data, portName = 'COM1')

// Đóng port
closeSerialPort()
```

### API Endpoint: `/api/robot/command`

**Request:**
```json
POST /api/robot/command
{
  "action": "borrow" | "return",
  "books": [
    {
      "rfid": "...",
      "name": "...",
      "position_x": 25.3,
      "position_y": 29.9,
      "position_z": 16.1
    }
  ],
  "portName": "COM1" // Optional, default COM1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã gửi 3 vị trí sách đến Robot",
  "payload": { ... },
  "serialResult": {
    "success": true,
    "data": "..."
  }
}
```

## Thiết lập Serial Port ảo (Testing)

### Sử dụng ActiveX (Windows)

```javascript
var library = (ISerialPortLibrary) new ActiveXObject("hhdvspkit.SerialPortLibrary.5");
var port1 = library.createBridgePort(1);
var port2 = library.createBridgePort(2);
port1.bridgePort = 2;
port2.bridgePort = 1;
```

### Sử dụng com0com (Windows)

1. Download: https://sourceforge.net/projects/com0com/
2. Cài đặt và tạo cặp port ảo: COM1 <-> COM2
3. Ứng dụng gửi vào COM1, tool test đọc từ COM2

### Sử dụng socat (Linux/Mac)

```bash
socat -d -d pty,raw,echo=0 pty,raw,echo=0
# Tạo 2 port ảo, ví dụ: /dev/ttys002 và /dev/ttys003
```

## Test Serial Port

### 1. Mock Mode (Không cần serial port)

Khi chạy trên browser hoặc không có serial port, hệ thống tự động chuyển sang mock mode và log ra console:

```
📡 [MOCK] Gửi dữ liệu đến serial port: {...}
```

### 2. Real Serial Port

Cập nhật port name trong code:

**File: `lib/api.js`**
```javascript
export async function sendRobotCommand(action, books, portName = 'COM1') {
  // Thay 'COM1' thành port thực tế của bạn
}
```

### 3. Monitor Serial Port

**Windows - PuTTY:**
```
- Connection Type: Serial
- Serial line: COM2
- Speed: 9600
- Flow control: None
```

**Linux - minicom:**
```bash
minicom -D /dev/ttyUSB0 -b 9600
```

**Node.js Script:**
```javascript
const { SerialPort } = require('serialport')
const port = new SerialPort({ path: 'COM2', baudRate: 9600 })

port.on('data', (data) => {
  console.log('Received:', data.toString())
})
```

## Debug và Logging

Console logs khi gửi lệnh:

```
📡 Chuẩn bị gửi đến Robot: {action: "borrow", ...}
✅ Serial port COM1 đã kết nối (9600 baud)
✅ Đã gửi dữ liệu: {"action":"borrow",...}
```

Browser console:
```
📡 Gửi lệnh lấy sách: [{rfid: "...", name: "...", ...}]
✅ Robot response: {success: true, ...}
```

## Lỗi thường gặp

### 1. Port không mở được
```
Error: Error: No such file or directory, cannot open COM1
```
**Giải pháp:** Kiểm tra port có tồn tại không, thử liệt kê:
```javascript
const { SerialPort } = require('serialport')
SerialPort.list().then(ports => console.log(ports))
```

### 2. Permission denied (Linux)
```
Error: Error: Permission denied, cannot open /dev/ttyUSB0
```
**Giải pháp:**
```bash
sudo usermod -a -G dialout $USER
# Logout và login lại
```

### 3. Port đã được sử dụng
```
Error: Error: Port is already open
```
**Giải pháp:** Đóng port trước khi mở lại:
```javascript
await closeSerialPort()
await initSerialPort('COM1')
```

## Tùy chỉnh

### Thay đổi Baud Rate

**File: `lib/serialPort.js`**
```javascript
export const initSerialPort = async (portName = 'COM1', baudRate = 115200) {
  // Đổi từ 9600 → 115200 để tốc độ cao hơn
}
```

### Thêm checksum/validation

**File: `pages/api/robot/command.js`**
```javascript
const payload = {
  action: action,
  timestamp: new Date().toISOString(),
  checksum: calculateChecksum(books), // Thêm checksum
  books: books.map(...)
}
```

## Tích hợp với Robot thực

1. **Robot kết nối serial port** (COM1 hoặc tương đương)
2. **Robot listen incoming JSON** trên port đó
3. **Parse JSON** và lấy thông tin:
   - `action`: "borrow" hoặc "return"
   - `books[].position.x/y/z`: Tọa độ di chuyển
   - `books[].sequence`: Thứ tự xử lý
4. **Robot thực hiện theo thứ tự** sequence từ 1 → n

## Ví dụ xử lý trên Robot (Pseudo-code)

```python
import serial
import json

ser = serial.Serial('COM1', 9600)

while True:
    line = ser.readline().decode('utf-8').strip()
    if line:
        data = json.loads(line)
        
        if data['action'] == 'borrow':
            for book in sorted(data['books'], key=lambda x: x['sequence']):
                move_to(book['position']['x'], 
                       book['position']['y'], 
                       book['position']['z'])
                pick_book()
                
        elif data['action'] == 'return':
            for book in sorted(data['books'], key=lambda x: x['sequence']):
                pick_book_from_tray()  # Lấy sách từ khay theo thứ tự
                move_to(book['position']['x'], 
                       book['position']['y'], 
                       book['position']['z'])
                place_book()
```

## Tham khảo

- Serial Port Library: https://serialport.io/
- JSON Format: https://www.json.org/
- com0com: https://sourceforge.net/projects/com0com/
- Node.js SerialPort: https://www.npmjs.com/package/serialport
