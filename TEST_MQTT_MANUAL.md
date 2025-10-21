# Test MQTT WebSocket - Hướng dẫn chi tiết

## 🎯 Mục tiêu
Kiểm tra xem MQTT WebSocket đã nhận được JSON từ app chưa

---

## Phương pháp 1: HiveMQ WebSocket Client (Khuyến nghị)

### Bước 1: Mở HiveMQ Client
```
URL: https://www.hivemq.com/demos/websocket-client/
```

### Bước 2: Kết nối
```yaml
Host: broker.hivemq.com
Port: 8884
Path: /mqtt
Client ID: (để trống - tự động random)
Username: (để trống)
Password: (để trống)
```
**→ Click "Connect"**

Khi connected, bạn sẽ thấy:
```
✅ Connected to broker.hivemq.com:8884/mqtt
```

### Bước 3: Subscribe Topic
**Phần "Subscriptions":**
```yaml
Topic: robot_thu_vien/command
QoS: 1
Color: Green
```
**→ Click "Subscribe"**

Bạn sẽ thấy:
```
📥 Subscribed to robot_thu_vien/command (QoS 1)
```

### Bước 4: Test từ App
1. Mở app: http://localhost:3000/robot
2. Click "Kết nối MQTT"
3. Chọn chế độ "Mượn sách"
4. Nhập order ID (ví dụ: 46)
5. Click "Tiến hành lấy sách"

### Bước 5: Kiểm tra Message
**Quay lại HiveMQ WebSocket Client**, bạn sẽ thấy message trong phần "Messages":

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
    }
  ]
}
```

✅ **Nếu thấy message này → MQTT hoạt động hoàn hảo!**

---

## Phương pháp 2: Browser Console Logging

### Bước 1: Mở DevTools
- Windows: `F12` hoặc `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

### Bước 2: Chuyển sang tab "Console"

### Bước 3: Thực hiện action trong app
Click "Tiến hành lấy sách" và xem log:

```
🔌 Connecting to MQTT broker: wss://broker.hivemq.com:8884/mqtt
✅ Connected to MQTT broker
📥 Subscribed to: robot_thu_vien/data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 Publishing to MQTT: robot_thu_vien/command
   Action: borrow
   Books: 2
   Command: {"action":"borrow","timestamp":"2025-10-21T...","books":[...]}
✅ Command published to MQTT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

✅ **Nếu thấy "Command published to MQTT" → JSON đã được gửi!**

---

## Phương pháp 3: Test với Node.js Script

Tạo file test MQTT subscriber:

```javascript
// test-mqtt-subscriber.js
const mqtt = require('mqtt')

const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
  clientId: 'test_subscriber_' + Math.random().toString(16).substr(2, 8)
})

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker')
  client.subscribe('robot_thu_vien/command', { qos: 1 }, (err) => {
    if (!err) {
      console.log('📥 Subscribed to robot_thu_vien/command')
      console.log('⏳ Waiting for messages...')
    }
  })
})

client.on('message', (topic, message) => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📨 Message received!')
  console.log('   Topic:', topic)
  console.log('   Data:', message.toString())
  
  try {
    const json = JSON.parse(message.toString())
    console.log('   Parsed JSON:')
    console.log(JSON.stringify(json, null, 2))
  } catch (e) {
    console.log('   (Not JSON format)')
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
})

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err)
})

console.log('🔌 Connecting to HiveMQ broker...')
```

**Chạy:**
```bash
node test-mqtt-subscriber.js
```

**Kết quả mong đợi:**
```
🔌 Connecting to HiveMQ broker...
✅ Connected to MQTT broker
📥 Subscribed to robot_thu_vien/command
⏳ Waiting for messages...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 Message received!
   Topic: robot_thu_vien/command
   Data: {"action":"borrow",...}
   Parsed JSON:
   {
     "action": "borrow",
     "timestamp": "2025-10-21T10:30:00.000Z",
     "books": [...]
   }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phương pháp 4: MQTT Explorer GUI

### Tải MQTT Explorer
```
URL: http://mqtt-explorer.com/
```

### Kết nối
```yaml
Name: HiveMQ Robot Test
Protocol: wss://
Host: broker.hivemq.com
Port: 8884
Path: /mqtt
```

### Subscribe
```
Topic: robot_thu_vien/#
```

Bạn sẽ thấy tree view với tất cả messages!

---

## 🐛 Troubleshooting

### ❌ Không thấy message trong HiveMQ Client

**Check 1: MQTT có connected không?**
- Browser console log: "✅ Connected to MQTT broker"
- Status trong RobotConnection: "Đã kết nối MQTT"

**Check 2: Topic đúng chưa?**
- Subscribe: `robot_thu_vien/command` (không có dấu cách, đúng chính tả)

**Check 3: QoS level**
- Đặt QoS = 1 (at least once)

**Check 4: Firewall/Network**
- Test trên mạng khác (mobile hotspot)
- Check WebSocket WSS port 8884

### ❌ Console log "Publish error"

```javascript
// Check internet connection
// Check broker URL: wss://broker.hivemq.com:8884/mqtt
// Verify client connected before publishing
```

### ❌ Message bị delay

- MQTT QoS 1 có thể delay 100-500ms (bình thường)
- HiveMQ public broker không guarantee latency
- Nếu cần real-time, dùng dedicated broker

---

## ✅ Success Checklist

- [ ] HiveMQ Client connected
- [ ] Subscribed to `robot_thu_vien/command`
- [ ] App MQTT connected (status = "Đã kết nối MQTT")
- [ ] Click "Tiến hành lấy sách"
- [ ] Console log "✅ Command published to MQTT"
- [ ] HiveMQ Client nhận được JSON message
- [ ] JSON format đúng: `{action, timestamp, books: [{sequence, rfid, name, position}]}`

**Nếu tất cả pass → MQTT system hoạt động hoàn hảo! 🎉**

---

## 📝 JSON Format Expected

```json
{
  "action": "borrow",
  "timestamp": "2025-10-21T10:30:00.000Z",
  "books": [
    {
      "sequence": 1,
      "rfid": "2516072455",
      "name": "Introduction to Programming",
      "position": {
        "x": 10,
        "y": 20,
        "z": 5
      }
    },
    {
      "sequence": 2,
      "rfid": "1234567890",
      "name": "Data Structures",
      "position": {
        "x": 15,
        "y": 25,
        "z": 3
      }
    }
  ]
}
```

**Return action:**
```json
{
  "action": "return",
  "timestamp": "2025-10-21T11:00:00.000Z",
  "books": [...]
}
```
