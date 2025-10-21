# ✅ Checklist kiểm tra hệ thống MQTT

## 🎯 Mục tiêu
Kiểm tra hệ thống đã hoàn tất chuyển đổi từ Serial/COM port sang MQTT WebSocket

## ✅ Code Changes Completed

- [x] Cài đặt mqtt package (`npm install mqtt --save`)
- [x] Tạo `lib/MQTTClient.js` với đầy đủ chức năng
- [x] Refactor `components/RobotConnection.js` sang MQTT UI
- [x] Cập nhật `pages/robot.js` để sử dụng MQTT
- [x] Xóa `sendRobotCommand()` trong `lib/api.js`
- [x] Tạo documentation `MQTT_SYSTEM.md`

## 📋 Testing Steps

### 1. Kiểm tra Dev Server
```bash
npm run dev
```
- [ ] Server khởi động thành công
- [ ] Không có lỗi compile
- [ ] Mở http://localhost:3000

### 2. Test MQTT Connection UI
- [ ] Vào trang `/robot`
- [ ] Component `RobotConnection` hiển thị:
  - [ ] "🤖 Kết nối Robot (MQTT)"
  - [ ] MQTT Broker: HiveMQ Public Broker
  - [ ] Topics: `robot_thu_vien/command` và `robot_thu_vien/data`
  - [ ] Nút "🔌 Kết nối MQTT"
- [ ] KHÔNG còn hiển thị:
  - [ ] COM port selector
  - [ ] "Cổng: COM5 | Baudrate: 9600"
  - [ ] Force Cleanup button

### 3. Test MQTT Connection
- [ ] Click "Kết nối MQTT"
- [ ] Toast notification: "Đã kết nối MQTT broker"
- [ ] Status đổi thành "Đã kết nối MQTT" (màu xanh)
- [ ] Console log: `✅ Connected to MQTT broker`
- [ ] Nút đổi thành "🔌 Ngắt kết nối"

### 4. Test MQTT Disconnect
- [ ] Click "Ngắt kết nối"
- [ ] Toast notification: "Đã ngắt kết nối MQTT"
- [ ] Status đổi thành "Chưa kết nối" (màu đỏ)
- [ ] Nút đổi lại thành "🔌 Kết nối MQTT"

### 5. Test Borrow Flow (Mượn sách)

#### 5.1 Chuẩn bị
- [ ] Có đơn hàng với status = 'ordering' trong database
- [ ] Sách trong đơn có position_x, position_y, position_z

#### 5.2 Workflow
- [ ] Kết nối MQTT thành công
- [ ] Chọn chế độ "Mượn sách"
- [ ] Nhập mã đơn hàng (ví dụ: 1)
- [ ] Click "Tìm đơn hàng"
- [ ] Danh sách sách hiển thị với vị trí
- [ ] Click "🤖 Tiến hành lấy sách"
- [ ] Console log:
  ```
  📡 BƯỚC 1: Chuẩn bị gửi lệnh lấy sách qua MQTT
  ✅ BƯỚC 2: MQTT message đã publish
  ✅ BƯỚC 3: Cập nhật trạng thái đơn hàng
  ```
- [ ] Toast: "✅ Hoàn tất! 📡 Đã gửi lệnh qua MQTT"
- [ ] Status đơn hàng: `ordering` → `pending`

### 6. Test Return Flow (Trả sách)

#### 6.1 Chuẩn bị
- [ ] Có đơn hàng với status = 'pending'
- [ ] Sách trong đơn có `return_timestamp = null`

#### 6.2 Workflow
- [ ] Kết nối MQTT thành công
- [ ] Chọn chế độ "Trả sách"
- [ ] Nhập mã đơn hàng
- [ ] Quét RFID các sách (hoặc nhập thủ công)
- [ ] Click "✓ Xác nhận trả"
- [ ] Console log:
  ```
  📥 BƯỚC 1: Chuẩn bị trả sách
  📡 BƯỚC 2: Gửi JSON đến robot qua MQTT
  ✅ BƯỚC 3: MQTT message đã publish
  ✅ BƯỚC 4: Đã cập nhật database
  ```
- [ ] Toast: "✅ Hoàn tất! 📥 Đã trả X sách"
- [ ] Database: `return_timestamp` được set

### 7. Test với HiveMQ WebSocket Client

#### 7.1 Setup HiveMQ Client
1. Mở: https://www.hivemq.com/demos/websocket-client/
2. Host: `broker.hivemq.com`, Port: `8884`, Path: `/mqtt`
3. Click "Connect"
4. Add subscription: `robot_thu_vien/command`

#### 7.2 Test Publish từ App
- [ ] Trong app, thực hiện flow mượn sách
- [ ] HiveMQ client nhận được message:
  ```json
  {
    "action": "borrow",
    "timestamp": "2025-10-21T...",
    "books": [
      {
        "sequence": 1,
        "rfid": "...",
        "name": "...",
        "position": {"x": 10, "y": 20, "z": 5}
      }
    ]
  }
  ```

#### 7.3 Test Subscribe trong App
- [ ] Trong HiveMQ client, publish đến `robot_thu_vien/data`:
  ```json
  {
    "status": "completed",
    "message": "Robot đã hoàn thành"
  }
  ```
- [ ] App console log nhận được message
- [ ] Event `robot_data` được emit

### 8. Test Error Handling

#### 8.1 Không kết nối MQTT
- [ ] Không click "Kết nối MQTT"
- [ ] Thử mượn sách
- [ ] Toast error: "❌ MQTT chưa kết nối!"

#### 8.2 Mất kết nối giữa chừng
- [ ] Tắt internet
- [ ] App hiển thị "Đang kết nối lại..."
- [ ] Bật internet lại
- [ ] App tự reconnect

#### 8.3 Invalid JSON
- [ ] (Kiểm tra với robot) Robot nhận được malformed JSON
- [ ] Robot log error nhưng không crash

### 9. Browser Compatibility
- [ ] Chrome/Edge - Hoạt động bình thường
- [ ] Firefox - Hoạt động bình thường
- [ ] Safari - Hoạt động bình thường (nếu có Mac)

### 10. Persistence Test
- [ ] Kết nối MQTT tại `/robot`
- [ ] Navigate đến `/user` hoặc `/admin`
- [ ] Quay lại `/robot`
- [ ] MQTT vẫn connected (do singleton pattern)

## 🐛 Known Issues

_Ghi chú các bug phát hiện trong quá trình test:_

```
(Để trống - điền khi test)
```

## 📊 Performance

- [ ] MQTT connect time: < 2 giây
- [ ] Message publish time: < 100ms
- [ ] Reconnect time: < 5 giây
- [ ] Memory leak check: Không tăng memory sau 10 phút

## ✅ Final Checklist

- [ ] Tất cả test cases đều pass
- [ ] Không có lỗi trong console
- [ ] UI/UX mượt mà, không giật lag
- [ ] Toast notifications rõ ràng
- [ ] Documentation đầy đủ (`MQTT_SYSTEM.md`)
- [ ] Code không có console.error hay warning

## 🚀 Next Steps

Sau khi test xong:

1. **Xóa deprecated files:**
   ```bash
   rm lib/SerialConnector.js
   rm lib/SerialBridge.js
   rm lib/SerialBridgeClient.js
   rm lib/serialPortManager.js
   rm lib/useRobotStore.js
   rm scripts/start-serial-bridge.js
   rm -rf pages/api/robot/
   ```

2. **Cập nhật Robot/Arduino code:**
   - Subscribe topic: `robot_thu_vien/command`
   - Parse JSON format mới (xem `MQTT_SYSTEM.md`)
   - (Optional) Publish status đến `robot_thu_vien/data`

3. **Deploy:**
   - Test trên production
   - Verify MQTT hoạt động với firewall
   - Monitor connection stability

## 📝 Notes

- HiveMQ public broker là free, nhưng không có guarantee về uptime
- Nếu cần production-grade, cân nhắc:
  - AWS IoT Core
  - Azure IoT Hub
  - Self-hosted Mosquitto broker
- MQTT over WebSocket hoạt động tốt qua firewall/proxy
