# Robot Webhook API - Quick Guide

## 🎯 Mục đích
Nhận response từ Robot (success/fail) và hiển thị popup ngay lập tức trên giao diện web.

---

## 📡 Endpoint

### POST `/api/robot/webhook`
**URL đầy đủ:**
- Dev: `http://localhost:3000/api/robot/webhook`
- Production: `https://library-robot.vercel.app/api/robot/webhook`

### Request Body:
```json
{
  "process_status": "success"
}
```
hoặc
```json
{
  "process_status": "fail"
}
```

### Response:
```json
{
  "success": true,
  "message": "Response received successfully",
  "received": {
    "process_status": "success"
  }
}
```

---

## 🤖 Từ Robot/Arduino

### Cách 1: POST trực tiếp đến webhook (Khuyến nghị)

**Arduino/ESP32:**
```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

void sendStatus(String status) {
  HTTPClient http;
  http.begin("https://library-robot.vercel.app/api/robot/webhook");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"process_status\":\"" + status + "\"}";
  int httpCode = http.POST(payload);
  
  if (httpCode == 200) {
    Serial.println("✅ Status sent: " + status);
  } else {
    Serial.println("❌ Failed to send status");
  }
  
  http.end();
}

// Gọi khi hoàn thành
sendStatus("success");  // hoặc "fail"
```

---

### Cách 2: Publish MQTT (Khuyến nghị hơn)

**Arduino/ESP32:**
```cpp
#include <PubSubClient.h>
#include <ArduinoJson.h>

PubSubClient mqttClient(wifiClient);

void setup() {
  // Connect MQTT
  mqttClient.setServer("broker.hivemq.com", 1883);
  mqttClient.connect("robot_client_123");
}

void sendMQTTStatus(String status) {
  StaticJsonDocument<200> doc;
  doc["process_status"] = status;
  
  char buffer[200];
  serializeJson(doc, buffer);
  
  mqttClient.publish("robot_thu_vien/data", buffer);
  Serial.println("✅ MQTT sent: " + status);
}

// Gọi khi hoàn thành
sendMQTTStatus("success");  // hoặc "fail"
```

---

## 🌐 Test từ Browser/Terminal

### PowerShell:
```powershell
# Test Success
Invoke-WebRequest -Uri "http://localhost:3000/api/robot/webhook" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"process_status":"success"}'

# Test Fail
Invoke-WebRequest -Uri "http://localhost:3000/api/robot/webhook" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"process_status":"fail"}'
```

### curl:
```bash
# Test Success
curl -X POST http://localhost:3000/api/robot/webhook \
  -H "Content-Type: application/json" \
  -d '{"process_status":"success"}'

# Test Fail
curl -X POST http://localhost:3000/api/robot/webhook \
  -H "Content-Type: application/json" \
  -d '{"process_status":"fail"}'
```

### JavaScript (Browser Console):
```javascript
// Test Success
fetch('/api/robot/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ process_status: 'success' })
})

// Test Fail
fetch('/api/robot/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ process_status: 'fail' })
})
```

---

## 🎨 Kết quả trên giao diện web

### Khi nhận `process_status: "success"`:
```
🎉 Toast Popup (màu xanh):
"✅ Robot: Lấy sách thành công!"
```

### Khi nhận `process_status: "fail"`:
```
⚠️ Toast Popup (màu đỏ):
"❌ Robot: Lấy sách thất bại!"
```

---

## 🔄 Cách hoạt động

### Flow 1: Qua MQTT (Khuyến nghị)
```
Robot → MQTT Broker (HiveMQ) → Browser (Subscribe)
                                   ↓
                              Toast Popup
```

**Ưu điểm:**
- ✅ Real-time (ngay lập tức)
- ✅ Không cần server
- ✅ Scalable

### Flow 2: Qua Webhook + Polling (Fallback)
```
Robot → POST /api/robot/webhook → Server Memory
                                       ↑
                                 Browser Polling (2s)
                                       ↓
                                  Toast Popup
```

**Ưu điểm:**
- ✅ Đơn giản
- ✅ Không cần MQTT client trên robot

**Nhược điểm:**
- ⚠️ Delay 2 giây (polling interval)
- ⚠️ Server memory không persist

---

## 🧪 Testing Checklist

- [ ] Test success từ PowerShell
- [ ] Test fail từ PowerShell
- [ ] Verify toast popup hiển thị đúng
- [ ] Test với HiveMQ MQTT client
- [ ] Test với robot thật (Arduino/ESP32)

---

## 📝 Notes

1. **MQTT là cách tốt nhất** - Real-time, không cần polling
2. **Webhook là fallback** - Nếu robot không có MQTT client
3. **Polling interval: 2 giây** - Có thể thay đổi trong `pages/robot.js`
4. **Memory-based** - Server restart sẽ mất data. Dùng Redis/DB cho production.

---

## 🔧 Troubleshooting

### Popup không hiển thị?
1. Kiểm tra console log: `Robot response (Webhook): ...`
2. Test endpoint trực tiếp với curl
3. Verify page `/robot` đang mở

### Webhook không nhận request?
1. Check server logs
2. Verify Content-Type: `application/json`
3. Check JSON format đúng

### MQTT không hoạt động?
1. Check MQTT connection status
2. Verify topic: `robot_thu_vien/data`
3. Test với HiveMQ WebSocket Client
