# 🚀 HƯỚNG DẪN SỬ DỤNG SERIAL BRIDGE

## ✅ Đã cài đặt xong!

Hệ thống "Cầu nối" Serial Bridge đã được cài đặt và sẵn sàng sử dụng.

---

## 📋 CẤU TRÚC HỆ THỐNG

```
Browser (Robot/User/Admin pages)
        ↓ WebSocket (ws://localhost:8081)
Serial Bridge Server (Node.js)
        ↓ Serial Port COM5 (luôn giữ kết nối)
     Arduino
```

**Ưu điểm**:
- ✅ Bridge giữ kết nối Serial **liên tục**, không bao giờ đóng
- ✅ Tất cả pages giao tiếp qua WebSocket
- ✅ **Không còn lỗi "Access denied"**
- ✅ Chuyển page **không mất kết nối**
- ✅ Arduino **không bị reset**

---

## 🎯 CÁCH CHẠY (2 Terminals)

### Terminal 1: Serial Bridge Server

```bash
npm run bridge
```

**Output thành công**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌉 Starting Serial Bridge Server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SerialBridge WebSocket Server started
   Port: 8081
   URL: ws://localhost:8081
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Serial Bridge Server is running!

🔌 WebSocket URL: ws://localhost:8081

Press Ctrl+C to stop
```

**⚠️ QUAN TRỌNG**: Giữ terminal này chạy! Đừng tắt!

---

### Terminal 2: Next.js App

```bash
npm run dev
```

**Output thành công**:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000

✓ Ready in 2s
```

---

## 🌐 SỬ DỤNG TRONG BROWSER

### Bước 1: Import Client

```javascript
// Trong pages/robot.js hoặc bất kỳ page nào
const { getSerialBridgeClient } = require('../lib/SerialBridgeClient')

// Hoặc trong browser console
const client = window.bridgeClient
```

### Bước 2: Kết nối WebSocket

```javascript
const client = getSerialBridgeClient()

// Kết nối tới Bridge Server
await client.connect()
// → Console: "✅ Connected to SerialBridge"
```

### Bước 3: Kết nối Serial Port (1 lần duy nhất)

```javascript
// Kết nối COM5 với Arduino
await client.connectSerial('COM5', 9600)
// → Console: "✅ Serial connected to COM5"
// → Terminal 1: "🔌 Connecting to COM5 ..."
//               "✅ Serial connected to COM5"
```

### Bước 4: Gửi Commands

```javascript
// Gửi command mượn sách
await client.sendCommand('borrow', [
  {
    rfid: '2516072455',
    name: 'Book Title 1',
    position_x: 10,
    position_y: 20,
    position_z: 5
  }
])

// Terminal 1 sẽ log:
// 📡 Sending command to Arduino
//    Action: borrow
//    Books: 1
// ✅ Command sent to Arduino via COM5
```

### Bước 5: Lắng nghe Arduino Data

```javascript
// Đăng ký listener
client.on('arduino_data', (message) => {
  const data = message.data
  console.log('Arduino sent:', data)
  // Update UI với data từ Arduino
})

client.on('serial_connected', (info) => {
  console.log('Serial port connected:', info.port)
})

client.on('serial_disconnected', (info) => {
  console.log('Serial port disconnected:', info.message)
})
```

### Bước 6: Chuyển page tự do

```javascript
// Chuyển từ /robot → /user → /admin → /robot
// Kết nối Serial vẫn giữ nguyên!
// Không cần kết nối lại!
```

---

## 📡 API Reference

### `client.connect()`
Kết nối WebSocket tới Bridge Server.

**Returns**: `Promise<void>`

---

### `client.connectSerial(portName, baudRate)`
Kết nối Serial Port với Arduino (qua Bridge).

**Parameters**:
- `portName` (string): Tên port (COM5, COM3, ...)
- `baudRate` (number, default: 9600): Baud rate

**Returns**: `Promise<Object>`

**Example**:
```javascript
await client.connectSerial('COM5', 9600)
```

---

### `client.disconnectSerial()`
Ngắt kết nối Serial Port.

**Returns**: `Promise<Object>`

---

### `client.sendCommand(action, books)`
Gửi command đến Arduino.

**Parameters**:
- `action` (string): 'borrow' hoặc 'return'
- `books` (Array): Danh sách sách với rfid, name, position_x, position_y, position_z

**Returns**: `Promise<Object>`

**Example**:
```javascript
await client.sendCommand('borrow', [
  {
    rfid: '2516072455',
    name: 'Book 1',
    position_x: 10,
    position_y: 20,
    position_z: 5
  }
])
```

---

### `client.getStatus()`
Lấy trạng thái hiện tại của Bridge.

**Returns**: `Promise<Object>`

**Response**:
```json
{
  "type": "status",
  "isConnected": true,
  "port": "COM5",
  "clients": 2,
  "queueLength": 0
}
```

---

### `client.listPorts()`
Liệt kê các COM ports khả dụng.

**Returns**: `Promise<Array>`

**Example**:
```javascript
const ports = await client.listPorts()
// [
//   { path: 'COM5', manufacturer: 'wch.cn' },
//   { path: 'COM3', manufacturer: 'FTDI' }
// ]
```

---

### `client.on(eventType, handler)`
Đăng ký event listener.

**Event types**:
- `bridge_connected` - WebSocket kết nối thành công
- `bridge_disconnected` - WebSocket bị ngắt
- `serial_connected` - Serial port kết nối thành công
- `serial_disconnected` - Serial port bị ngắt
- `arduino_data` - Nhận data từ Arduino (JSON)
- `arduino_message` - Nhận message từ Arduino (text)
- `command_sent` - Command đã gửi thành công
- `error` - Lỗi xảy ra

**Example**:
```javascript
client.on('arduino_data', (message) => {
  console.log('Arduino:', message.data)
})

client.on('error', (message) => {
  console.error('Error:', message.error)
})
```

---

## 🧪 TEST FLOW

### Test 1: Chạy 2 servers ✅

```bash
# Terminal 1
npm run bridge
# → ✅ Serial Bridge Server is running!

# Terminal 2
npm run dev
# → ✅ Ready in 2s
```

---

### Test 2: Kết nối từ Browser ✅

```javascript
// Browser console (F12)
const { getSerialBridgeClient } = require('../lib/SerialBridgeClient')
const client = getSerialBridgeClient()

await client.connect()
// → ✅ Connected to SerialBridge

await client.connectSerial('COM5')
// → ✅ Serial connected to COM5
```

**Check Terminal 1**:
```
🔌 New WebSocket client: ::1:xxxxx
   Total clients: 1
🔌 Connecting to COM5 ...
✅ Serial connected to COM5
```

---

### Test 3: Gửi command ✅

```javascript
await client.sendCommand('borrow', [
  { rfid: 'test123', name: 'Test', position_x: 1, position_y: 2, position_z: 3 }
])
```

**Check Terminal 1**:
```
📡 Sending command to Arduino
   Action: borrow
   Books: 1
   Command: {
     "action": "borrow",
     "timestamp": "...",
     "books": [...]
   }
✅ Command sent to Arduino via COM5
```

---

### Test 4: Chuyển page ✅

```
1. /robot → Kết nối COM5
2. Chuyển → /user (kết nối vẫn giữ)
3. Chuyển → /admin (kết nối vẫn giữ)
4. Quay lại → /robot
5. Gửi command → Hoạt động ngay lập tức
```

**Terminal 1 không log "Connecting" lần 2** → Kết nối được giữ!

---

### Test 5: Multiple tabs ✅

```
1. Tab 1: /robot → Kết nối COM5
2. Tab 2: /user → Tự động dùng chung kết nối
3. Tab 1: Gửi command
4. Tab 2: Nhận broadcast từ Arduino
```

**Terminal 1**:
```
Total clients: 2
📡 Sending command to Arduino
📢 Broadcasted to 2 client(s): arduino_data
```

---

## 🐛 TROUBLESHOOTING

### Bridge không chạy: "EADDRINUSE: port 8081"

**Nguyên nhân**: Port 8081 đang bị dùng.

**Giải pháp**:
```bash
# Tìm process đang dùng port 8081
netstat -ano | findstr :8081

# Kill process
taskkill /PID <PID> /F

# Hoặc đổi port khác trong scripts/start-serial-bridge.js
```

---

### Browser không kết nối: "WebSocket error"

**Nguyên nhân**: Bridge server chưa chạy.

**Giải pháp**:
```bash
# Check Terminal 1 có chạy "npm run bridge" không
# Phải thấy: "Serial Bridge Server is running!"
```

---

### Serial Port "Access denied"

**Nguyên nhân**: Port đang bị dùng bởi chương trình khác.

**Giải pháp**:
1. Đóng Arduino IDE / PuTTY / Serial Monitor
2. Stop Bridge: Ctrl+C trong Terminal 1
3. Chờ 5 giây
4. Start lại: `npm run bridge`

---

### Arduino không nhận command

**Check 1**: Serial có kết nối không?
```javascript
const status = await client.getStatus()
console.log(status)
// → {isConnected: true, port: "COM5"}
```

**Check 2**: Baud rate đúng không?
```javascript
await client.connectSerial('COM5', 9600) // Phải khớp với Arduino
```

**Check 3**: Terminal 1 có log "Command sent" không?

---

## 📊 LOG MẪU (THÀNH CÔNG)

### Terminal 1 (Bridge Server):
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌉 Starting Serial Bridge Server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SerialBridge WebSocket Server started
   Port: 8081
   URL: ws://localhost:8081
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Serial Bridge Server is running!

🔌 New WebSocket client: ::1:50123
   Total clients: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 Message from ::1:50123 : connect_serial
🔌 Connecting to COM5 ...
✅ Serial connected to COM5
📢 Broadcasted to 1 client(s): serial_connected
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 Message from ::1:50123 : send_command
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Sending command to Arduino
   Action: borrow
   Books: 1
   Command: {
     "action": "borrow",
     "timestamp": "2025-01-21T...",
     "books": [
       {
         "sequence": 1,
         "rfid": "2516072455",
         "name": "Book Title 1",
         "position": {
           "x": 10,
           "y": 20,
           "z": 5
         }
       }
     ]
   }
✅ Command sent to Arduino via COM5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 Arduino data: {"status":"completed","books_processed":1}
📢 Broadcasted to 1 client(s): arduino_data
```

---

## ✅ CHECKLIST

- [ ] Terminal 1: `npm run bridge` → ✅ Running
- [ ] Terminal 2: `npm run dev` → ✅ Ready
- [ ] Browser: `client.connect()` → ✅ Connected
- [ ] Browser: `client.connectSerial('COM5')` → ✅ Connected
- [ ] Browser: `client.sendCommand(...)` → ✅ Sent
- [ ] Terminal 1: Log "Command sent" → ✅ Yes
- [ ] Chuyển page → Kết nối giữ nguyên → ✅ Yes

**Nếu tất cả ✅ → Hệ thống hoạt động hoàn hảo!**

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, check:
1. Terminal 1 có chạy `npm run bridge` không?
2. Terminal 2 có chạy `npm run dev` không?
3. Browser console (F12) có lỗi không?
4. Terminal 1 log có lỗi không?

Xem thêm: `SERIAL_BRIDGE_GUIDE.md`

---

**Happy coding!** 🚀
