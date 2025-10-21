# 🌉 Serial Bridge System - Giải pháp "Cầu nối" liên tục

## 🎯 Vấn đề

**Trước đây**: Mỗi giao diện (Robot/User/Admin) **mở/đóng Serial Port riêng** → Xung đột "Access denied"

**Giải pháp**: Tạo một **Bridge Server** giữ kết nối Serial **liên tục**, tất cả giao diện giao tiếp qua WebSocket

---

## 🏗️ Kiến trúc mới

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Robot   │  │   User   │  │  Admin   │            │
│  │  Page    │  │   Page   │  │   Page   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                    │
│       └─────────────┴─────────────┘                    │
│                     │                                   │
│              WebSocket Client                           │
│            (SerialBridgeClient.js)                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                WebSocket
              ws://localhost:8080
                      │
┌─────────────────────▼───────────────────────────────────┐
│  Bridge Server (Node.js Process)                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │  SerialBridge.js                                 │ │
│  │                                                   │ │
│  │  • Giữ kết nối Serial LIÊN TỤC với Arduino      │ │
│  │  • WebSocket Server cho browser clients         │ │
│  │  • Broadcast Arduino data → all clients          │ │
│  │  • Queue commands khi Arduino bận                │ │
│  └──────────────────┬───────────────────────────────┘ │
└─────────────────────┼───────────────────────────────────┘
                      │
                 Serial Port
                 (luôn mở)
                      │
┌─────────────────────▼───────────────────────────────────┐
│  Arduino                                                 │
│  • Nhận JSON commands                                   │
│  • Gửi status/data về                                   │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Ưu điểm

| Trước | Sau (Bridge) |
|-------|--------------|
| ❌ Mỗi page mở/đóng Serial riêng | ✅ Bridge giữ Serial **1 lần duy nhất** |
| ❌ "Access denied" khi chuyển page | ✅ **Không có lỗi**, kết nối liên tục |
| ❌ Delay mở/đóng port (300-500ms) | ✅ **Không delay**, gửi command ngay lập tức |
| ❌ Arduino reset khi reconnect | ✅ **Không reset**, kết nối không đổi |
| ❌ Log rải rác nhiều nơi | ✅ **Tập trung** ở Bridge Server |
| ❌ Không broadcast data | ✅ Arduino data → **tất cả clients** nhận được |

---

## 🚀 Hướng dẫn sử dụng

### Bước 1: Chạy Bridge Server (Terminal 1)

```bash
npm run bridge
```

**Output mong đợi**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌉 Starting Serial Bridge Server...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SerialBridge WebSocket Server started
   Port: 8080
   URL: ws://localhost:8080
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Serial Bridge Server is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Instructions:
   1. Keep this server running
   2. Open browser: http://localhost:3000/robot
   3. Connect to Arduino via WebSocket
   4. All pages can now communicate with Arduino

🔌 WebSocket URL: ws://localhost:8080

Press Ctrl+C to stop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Giữ terminal này chạy!** Đừng tắt.

---

### Bước 2: Chạy Next.js App (Terminal 2)

```bash
npm run dev
```

**Output mong đợi**:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000

✓ Ready in 2s
```

---

### Bước 3: Sử dụng trong Browser

#### 3.1. Kết nối lần đầu (chỉ 1 lần)

```javascript
// Trong pages/robot.js (hoặc bất kỳ page nào)
import { getSerialBridgeClient } from '../lib/SerialBridgeClient'

const client = getSerialBridgeClient()

// Kết nối WebSocket
await client.connect()

// Kết nối Serial Port
await client.connectSerial('COM5', 9600)
```

#### 3.2. Gửi command

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
```

#### 3.3. Lắng nghe Arduino data

```javascript
// Đăng ký handler
client.on('arduino_data', (data) => {
  console.log('Arduino sent:', data)
  // Update UI
})

client.on('serial_connected', (info) => {
  console.log('Serial connected to', info.port)
})

client.on('serial_disconnected', () => {
  console.log('Serial disconnected')
})
```

#### 3.4. Chuyển page (tự do)

```javascript
// Chuyển từ /robot → /user → /admin → /robot
// → Kết nối Serial vẫn giữ nguyên!
// → Không cần kết nối lại!
```

---

## 📡 WebSocket Message Protocol

### Client → Bridge

#### 1. Kết nối Serial
```json
{
  "type": "connect_serial",
  "payload": {
    "portName": "COM5",
    "baudRate": 9600
  }
}
```

#### 2. Ngắt kết nối Serial
```json
{
  "type": "disconnect_serial"
}
```

#### 3. Gửi command
```json
{
  "type": "send_command",
  "payload": {
    "action": "borrow",
    "books": [
      {
        "rfid": "2516072455",
        "name": "Book 1",
        "position_x": 10,
        "position_y": 20,
        "position_z": 5
      }
    ]
  }
}
```

#### 4. Lấy status
```json
{
  "type": "get_status"
}
```

#### 5. Liệt kê ports
```json
{
  "type": "list_ports"
}
```

---

### Bridge → Client

#### 1. Serial connected
```json
{
  "type": "serial_connected",
  "port": "COM5",
  "message": "Connected to COM5"
}
```

#### 2. Serial disconnected
```json
{
  "type": "serial_disconnected",
  "message": "Disconnected from COM5"
}
```

#### 3. Command sent
```json
{
  "type": "command_sent",
  "success": true,
  "command": { ... },
  "port": "COM5"
}
```

#### 4. Arduino data (broadcast)
```json
{
  "type": "arduino_data",
  "data": {
    "status": "completed",
    "books_processed": 3
  }
}
```

#### 5. Arduino message (text)
```json
{
  "type": "arduino_message",
  "message": "Ready to receive commands"
}
```

#### 6. Status
```json
{
  "type": "status",
  "isConnected": true,
  "port": "COM5",
  "clients": 3,
  "queueLength": 0
}
```

#### 7. Error
```json
{
  "type": "error",
  "error": "Serial not connected. Please connect first."
}
```

---

## 🧪 Testing Flow

### Test 1: Kết nối Bridge (2 phút)

```bash
# Terminal 1
npm run bridge

# Chờ thấy: ✅ Serial Bridge Server is running!
```

**✅ Pass**: Server chạy không lỗi, log hiển thị `ws://localhost:8080`

---

### Test 2: Kết nối từ Browser (3 phút)

```javascript
// Trong browser console (F12)
const client = window.bridgeClient // Hoặc import

await client.connect()
// → ✅ Connected to SerialBridge

await client.connectSerial('COM5')
// → ✅ Serial connected to COM5

// Check Terminal 1:
// 🔌 New WebSocket client: ...
// 🔌 Connecting to COM5 ...
// ✅ Serial connected to COM5
```

**✅ Pass**: 
- Browser console: "Connected to SerialBridge"
- Terminal 1: "New WebSocket client" + "Serial connected"

---

### Test 3: Gửi command (2 phút)

```javascript
await client.sendCommand('borrow', [
  { rfid: 'test123', name: 'Test Book', position_x: 10, position_y: 20, position_z: 5 }
])

// Check Terminal 1:
// 📡 Sending command to Arduino
//    Action: borrow
//    Books: 1
// ✅ Command sent to Arduino via COM5
```

**✅ Pass**: Terminal 1 hiển thị JSON command đầy đủ

---

### Test 4: Chuyển page (2 phút)

```
1. /robot → Kết nối COM5
2. Chuyển → /user
3. Chuyển → /admin
4. Quay lại → /robot
5. Gửi command → Hoạt động ngay lập tức
```

**✅ Pass**: 
- Không cần kết nối lại
- Terminal 1 không log "Connecting to COM5" lần 2
- Command gửi thành công

---

### Test 5: Multiple clients (3 phút)

```
1. Mở Tab 1: /robot → Kết nối COM5
2. Mở Tab 2: /user → Không cần kết nối lại
3. Tab 1: Gửi command → Terminal log "📡 Sending command"
4. Tab 2: Nhận broadcast → client.on('arduino_data')
```

**✅ Pass**: 
- Terminal 1: "Total clients: 2"
- Command từ Tab 1 → Tab 2 nhận được event

---

### Test 6: Arduino response (5 phút - cần Arduino thật)

```
1. Arduino gửi: {"status":"completed"}
2. Bridge nhận và broadcast
3. Tất cả browser tabs nhận được event

// Trong browser:
client.on('arduino_data', (data) => {
  console.log('Arduino:', data)
  // → {status: "completed"}
})
```

**✅ Pass**: Log hiển thị Arduino data trong tất cả tabs

---

## 🐛 Troubleshooting

### Bridge không chạy được

```bash
# Lỗi: Cannot find module 'ws'
npm install ws --save

# Lỗi: Cannot find module './SerialBridge.js'
# → Check file tồn tại: lib/SerialBridge.js
```

---

### Browser không kết nối được WebSocket

```javascript
// Check URL đúng chưa
const client = getSerialBridgeClient('ws://localhost:8080')

// Check Bridge server có chạy không
// Terminal 1 phải hiển thị: "Serial Bridge Server is running!"
```

---

### Serial Port "Access denied"

```bash
# Bridge đang giữ port → OK!
# Nếu lỗi ngay khi khởi động Bridge:
# 1. Đóng Arduino IDE / PuTTY / Serial Monitor
# 2. Restart Bridge: Ctrl+C → npm run bridge
```

---

### Arduino không nhận command

```javascript
// Check Serial có kết nối không
await client.getStatus()
// → {isConnected: true, port: "COM5"}

// Check baud rate đúng không
await client.connectSerial('COM5', 9600) // Phải khớp với Arduino
```

---

## 📊 So sánh Old vs New

| Chức năng | Old (Direct Serial) | New (Bridge) |
|-----------|---------------------|--------------|
| Mở port | Mỗi page tự mở/đóng | Bridge mở 1 lần |
| Chuyển page | Đóng → Mở lại (delay 300ms) | Không động chạm |
| Lỗi "Access denied" | Thường xuyên | Không bao giờ |
| Arduino reset | Mỗi lần reconnect | Không bao giờ |
| Broadcast data | Không có | Tất cả clients nhận |
| Log debug | Rải rác nhiều file | Tập trung Bridge |
| Số kết nối Serial | N (theo số pages) | 1 (duy nhất) |

---

## 🎯 Kết luận

**Bridge System** giải quyết triệt để vấn đề:
- ✅ **"Access denied"** → Không còn xảy ra
- ✅ **Kết nối liên tục** → Arduino luôn sẵn sàng
- ✅ **Broadcast** → Tất cả pages nhận data
- ✅ **Zero delay** → Gửi command ngay lập tức
- ✅ **Scalable** → Dễ thêm features mới

---

## 📂 Files tạo mới

1. **`lib/SerialBridge.js`** (400+ dòng)
   - WebSocket Server
   - Serial Port Manager
   - Message routing
   - Broadcast system

2. **`lib/SerialBridgeClient.js`** (300+ dòng)
   - WebSocket Client cho browser
   - Event system
   - High-level API
   - Auto reconnect

3. **`scripts/start-serial-bridge.js`** (50 dòng)
   - Standalone server script
   - Graceful shutdown

4. **`SERIAL_BRIDGE_GUIDE.md`** (file này)
   - Tài liệu đầy đủ

---

**Ready to use!** 🚀

Chạy 2 terminals:
```bash
# Terminal 1
npm run bridge

# Terminal 2
npm run dev
```

Then open: http://localhost:3000/robot
