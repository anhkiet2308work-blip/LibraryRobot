# Hệ thống MQTT cho Robot Thư viện

## Tổng quan

Hệ thống đã được chuyển đổi từ **Serial/COM port** sang **MQTT WebSocket** để giao tiếp với robot.

### Kiến trúc

```
Browser (Next.js) ←→ MQTT Client (lib/MQTTClient.js) ←→ HiveMQ Broker ←→ Robot/Arduino
```

## Cấu hình MQTT

### Broker
- **URL**: `wss://broker.hivemq.com:8884/mqtt`
- **Provider**: HiveMQ Public Broker (cloud-based, miễn phí)
- **Protocol**: MQTT v5 over WebSocket
- **QoS**: 1 (at least once delivery)
- **Client ID**: `library_robot_[random]` (tự động tạo)

### Topics

#### 1. Command Topic (Publish)
- **Topic**: `robot_thu_vien/command`
- **Direction**: Browser → Robot
- **Purpose**: Gửi lệnh mượn/trả sách đến robot

#### 2. Data Topic (Subscribe)
- **Topic**: `robot_thu_vien/data`
- **Direction**: Robot → Browser
- **Purpose**: Nhận dữ liệu/trạng thái từ robot

## Format JSON Message

### Mượn sách (Borrow)
```json
{
  "action": "borrow",
  "timestamp": "2025-10-21T10:30:00.000Z",
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
    },
    {
      "sequence": 2,
      "rfid": "1234567890",
      "name": "Book Title 2",
      "position": {
        "x": 15,
        "y": 25,
        "z": 3
      }
    }
  ]
}
```

### Trả sách (Return)
```json
{
  "action": "return",
  "timestamp": "2025-10-21T11:45:00.000Z",
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
```

## Các file quan trọng

### 1. `lib/MQTTClient.js`
MQTT WebSocket client để giao tiếp với broker HiveMQ.

**Chức năng chính:**
- `connect()` - Kết nối đến MQTT broker
- `disconnect()` - Ngắt kết nối
- `sendCommand(action, books)` - Publish message đến topic `robot_thu_vien/command`
- `handleRobotData(message)` - Xử lý message từ topic `robot_thu_vien/data`

**Events:**
- `mqtt_connected` - Kết nối thành công
- `mqtt_disconnected` - Mất kết nối
- `mqtt_error` - Có lỗi xảy ra
- `mqtt_reconnecting` - Đang reconnect
- `robot_data` - Nhận được data từ robot
- `robot_message` - Nhận được message từ robot

**Singleton pattern:**
```javascript
import { getMQTTClient } from '../lib/MQTTClient'

const mqttClient = getMQTTClient()
await mqttClient.connect()
```

### 2. `components/RobotConnection.js`
UI component để hiển thị trạng thái kết nối MQTT và nút kết nối/ngắt kết nối.

**Thay đổi:**
- ❌ Xóa: COM port selector, Serial status
- ✅ Thêm: MQTT broker info, topics display
- ✅ Event listeners cho MQTT events

### 3. `pages/robot.js`
Trang chính để mượn/trả sách.

**Thay đổi:**
- ❌ Xóa: `useRobotStore`, `sendRobotCommand()`
- ✅ Thêm: `getMQTTClient()`, direct MQTT publish
- ✅ Cập nhật `handleProceedBorrow()` - gửi MQTT thay vì Serial
- ✅ Cập nhật `handleConfirm()` (return mode) - gửi MQTT thay vì Serial

### 4. `lib/api.js`
API helper functions.

**Thay đổi:**
- ❌ Xóa: `sendRobotCommand()` function (không còn cần)

## Files đã deprecated (không còn dùng)

Các file sau không còn được sử dụng và có thể xóa:
- ❌ `lib/SerialConnector.js`
- ❌ `lib/SerialBridge.js`
- ❌ `lib/SerialBridgeClient.js`
- ❌ `lib/serialPortManager.js`
- ❌ `lib/useRobotStore.js`
- ❌ `scripts/start-serial-bridge.js`
- ❌ `pages/api/robot/connect.js`
- ❌ `pages/api/robot/disconnect.js`
- ❌ `pages/api/robot/command.js`
- ❌ `pages/api/robot/status.js`
- ❌ `pages/api/robot/cleanup.js`

## Workflow mới

### Mượn sách
1. User vào trang `/robot`
2. Click "Kết nối MQTT" → kết nối đến HiveMQ broker
3. Chọn chế độ "Mượn sách"
4. Nhập mã đơn hàng
5. Click "Tiến hành lấy sách"
6. **Browser gửi JSON trực tiếp qua MQTT** đến topic `robot_thu_vien/command`
7. Robot nhận message, di chuyển đến vị trí sách
8. Backend cập nhật database: `ordering` → `pending`

### Trả sách
1. User vào trang `/robot`
2. Kết nối MQTT (nếu chưa)
3. Chọn chế độ "Trả sách"
4. Nhập mã đơn hàng
5. Quét RFID các sách cần trả
6. Click "Xác nhận trả"
7. **Browser gửi JSON qua MQTT** với thứ tự sách đã quét
8. Robot nhận message, di chuyển đến vị trí trả sách
9. Backend cập nhật database: set `return_timestamp`

## Testing

### Test MQTT Connection
1. Mở browser: `http://localhost:3000/robot`
2. Click "Kết nối MQTT"
3. Check console: `✅ Connected to MQTT broker`
4. Status hiển thị "Đã kết nối MQTT"

### Test với HiveMQ WebSocket Client
1. Mở: https://www.hivemq.com/demos/websocket-client/
2. Connect đến `broker.hivemq.com:8884`
3. Subscribe topic: `robot_thu_vien/command`
4. Trong app, click "Tiến hành lấy sách"
5. HiveMQ client sẽ nhận được message JSON

### Test Robot Response
1. Robot/Arduino cần connect đến HiveMQ broker
2. Subscribe topic: `robot_thu_vien/command`
3. Parse JSON message
4. Di chuyển đến vị trí sách
5. (Optional) Publish status đến `robot_thu_vien/data`

## Ưu điểm của MQTT

✅ **Không cần Serial/COM port** - Hoạt động trên mọi thiết bị có web browser  
✅ **Cloud-based** - Không cần local server, không lo access denied  
✅ **Persistent connection** - WebSocket giữ kết nối liên tục  
✅ **Bi-directional** - Robot có thể gửi status/data về browser  
✅ **QoS 1** - Đảm bảo message được gửi ít nhất 1 lần  
✅ **Auto-reconnect** - Tự động kết nối lại khi mất kết nối  

## Dependencies

```json
{
  "mqtt": "^5.10.0"
}
```

Cài đặt:
```bash
npm install mqtt --save
```

## Troubleshooting

### Không kết nối được MQTT
- Check internet connection
- Verify broker URL: `wss://broker.hivemq.com:8884/mqtt`
- Check browser console for errors

### Message không được gửi
- Verify client đã connected (check `isConnected()`)
- Check topic name: `robot_thu_vien/command`
- Verify JSON format

### Robot không nhận được message
- Robot phải subscribe đúng topic: `robot_thu_vien/command`
- Check robot code parse JSON đúng format
- Test với HiveMQ WebSocket Client trước

## Tài liệu tham khảo

- HiveMQ Public Broker: https://www.hivemq.com/mqtt/public-mqtt-broker/
- HiveMQ WebSocket Client: https://www.hivemq.com/demos/websocket-client/
- MQTT.js Documentation: https://github.com/mqttjs/MQTT.js
