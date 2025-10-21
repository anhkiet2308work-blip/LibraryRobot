# 🤖 Hệ Thống Quản Lý Kết Nối Robot

## 📋 Tổng Quan

Hệ thống mới sử dụng **kết nối serial port liên tục** thay vì mở/đóng port mỗi lần gửi lệnh. Điều này giải quyết lỗi "Access denied" và cải thiện hiệu suất.

---

## 🏗️ Kiến Trúc

### 1. **Global Connection Manager** (`lib/serialPortManager.js`)
```javascript
- getSerialPort()    // Lấy kết nối hiện tại
- setSerialPort()    // Lưu kết nối
- clearSerialPort()  // Xóa kết nối
```

### 2. **API Endpoints Mới**

#### `/api/robot/connect` (POST)
**Chức năng**: Kết nối đến cổng COM
```json
Request:
{
  "port": "COM5",
  "baudRate": 9600
}

Response:
{
  "success": true,
  "message": "Connected to COM5",
  "port": "COM5",
  "baudRate": 9600
}
```

#### `/api/robot/disconnect` (POST)
**Chức năng**: Ngắt kết nối
```json
Response:
{
  "success": true,
  "message": "Disconnected from COM5"
}
```

#### `/api/robot/status` (GET)
**Chức năng**: Kiểm tra trạng thái kết nối
```json
Response:
{
  "isConnected": true,
  "port": "COM5",
  "hasInstance": true
}
```

#### `/api/robot/command` (POST) - **ĐÃ CẬP NHẬT**
**Chức năng**: Gửi lệnh qua kết nối đã mở (không cần `portName` nữa)
```json
Request:
{
  "action": "borrow",
  "books": [...]
}

Response:
{
  "success": true,
  "message": "Đã gửi 3 vị trí sách đến Robot qua COM5",
  "serialResult": {
    "port": "COM5",
    "bytesSent": 234,
    "success": true
  }
}
```

### 3. **Component `RobotConnection`**

**Props**:
- `onConnectionChange(isConnected, port)` - Callback khi trạng thái kết nối thay đổi

**Features**:
- 🟢 Hiển thị trạng thái kết nối (Đã kết nối / Chưa kết nối / Đang kết nối / Lỗi)
- 🔌 Chọn cổng COM (COM1-COM8)
- ✅ Nút Kết nối / Ngắt kết nối
- 🔄 Auto-refresh trạng thái
- 💡 Hướng dẫn sử dụng

---

## 🔄 Quy Trình Sử Dụng

### **Bước 1: Kết Nối Robot**
1. Vào trang Robot (`/robot`)
2. Trong panel "🤖 Kết Nối Robot":
   - Chọn cổng COM (mặc định: COM5)
   - Click "🔌 Kết Nối"
3. Đợi thông báo: "✅ Đã kết nối COM5"

### **Bước 2: Mượn Sách**
1. Click "📤 Mượn Sách"
2. Nhập mã đơn hàng → Tìm kiếm
3. Quét RFID các sách
4. Click "Tiến hành lấy sách"
5. Hệ thống tự động:
   - Gửi JSON qua kết nối đã mở
   - Cập nhật status: `ordering` → `pending`

### **Bước 3: Trả Sách**
1. Click "📥 Trả Sách"
2. Nhập mã đơn hàng → Tìm kiếm
3. Quét RFID các sách trả
4. Click "Xác nhận trả sách"
5. Hệ thống tự động:
   - Gửi JSON qua kết nối đã mở
   - Cập nhật return_timestamp
   - Tự động set status = `completed` (nếu trả hết)

### **Bước 4: Ngắt Kết Nối** (Khi xong việc)
1. Click "❌ Ngắt Kết Nối" trong panel Robot
2. Đợi thông báo: "✅ Đã ngắt kết nối"

---

## ⚠️ Xử Lý Lỗi

### Lỗi: "Robot chưa kết nối"
**Nguyên nhân**: Chưa kết nối robot trước khi mượn/trả sách
**Giải pháp**: Kết nối robot trong panel "🤖 Kết Nối Robot"

### Lỗi: "Access denied"
**Nguyên nhân**: Cổng COM đang được sử dụng bởi ứng dụng khác
**Giải pháp**:
1. Đóng các ứng dụng khác đang dùng COM port
2. Thử đổi sang cổng COM khác
3. Ngắt kết nối rồi kết nối lại

### Lỗi: "Serial write error"
**Nguyên nhân**: Kết nối bị mất giữa chừng
**Giải pháp**:
1. Click "🔄" (refresh) để kiểm tra trạng thái
2. Ngắt kết nối và kết nối lại
3. Kiểm tra cáp USB/Serial

---

## 🛠️ Thay Đổi Code

### Files Mới
```
components/RobotConnection.js         ← Component UI kết nối
lib/serialPortManager.js              ← Quản lý kết nối global
pages/api/robot/connect.js            ← API kết nối
pages/api/robot/disconnect.js         ← API ngắt kết nối
pages/api/robot/status.js             ← API kiểm tra trạng thái
```

### Files Đã Cập Nhật
```
pages/robot.js                        ← Thêm RobotConnection, xóa comPort selector
pages/api/robot/command.js            ← Dùng kết nối đã mở
lib/api.js                            ← sendRobotCommand không cần portName
```

---

## 🎯 Lợi Ích

### ✅ Trước (Cũ)
- ❌ Mở/đóng port mỗi lần gửi
- ❌ Lỗi "Access denied" thường xuyên
- ❌ Chậm (phải mở port mỗi lần)
- ❌ Không biết trạng thái kết nối

### ✅ Sau (Mới)
- ✅ Kết nối một lần, tái sử dụng
- ✅ Không còn lỗi "Access denied"
- ✅ Nhanh hơn (port đã mở sẵn)
- ✅ Hiển thị trạng thái kết nối real-time

---

## 📊 UI Mới

### Panel "🤖 Kết Nối Robot"

**Chưa kết nối**:
```
┌─────────────────────────────────┐
│ 🤖 Kết Nối Robot                │
├─────────────────────────────────┤
│ ⚪ Chưa kết nối              🔄  │
│                                 │
│ Chọn cổng COM:                  │
│ [  COM5  ▼]                     │
│                                 │
│ [   🔌 Kết Nối    ]             │
│                                 │
│ 💡 Hướng dẫn:                   │
│ • Kết nối Robot trước...        │
└─────────────────────────────────┘
```

**Đã kết nối**:
```
┌─────────────────────────────────┐
│ 🤖 Kết Nối Robot                │
├─────────────────────────────────┤
│ 🟢 Đã kết nối                🔄 │
│ Cổng: COM5 | Baudrate: 9600     │
│                                 │
│ ✅ Robot đã sẵn sàng nhận lệnh  │
│                                 │
│ [   ❌ Ngắt Kết Nối   ]         │
└─────────────────────────────────┘
```

---

## 🧪 Testing

### 1. Test Kết Nối
```bash
# Kết nối
curl -X POST http://localhost:3000/api/robot/connect \
  -H "Content-Type: application/json" \
  -d '{"port":"COM5","baudRate":9600}'

# Kiểm tra status
curl http://localhost:3000/api/robot/status

# Ngắt kết nối
curl -X POST http://localhost:3000/api/robot/disconnect
```

### 2. Test Gửi Lệnh
```bash
# Phải kết nối trước
curl -X POST http://localhost:3000/api/robot/connect \
  -H "Content-Type: application/json" \
  -d '{"port":"COM5","baudRate":9600}'

# Gửi lệnh (không cần portName nữa)
curl -X POST http://localhost:3000/api/robot/command \
  -H "Content-Type: application/json" \
  -d '{
    "action": "borrow",
    "books": [
      {"rfid": "123", "name": "Book 1", "position_x": 1, "position_y": 2, "position_z": 3}
    ]
  }'
```

---

## 🔒 Bảo Mật & Best Practices

1. **Luôn ngắt kết nối** khi không sử dụng
2. **Chỉ một kết nối** tại một thời điểm
3. **Kiểm tra trạng thái** trước khi gửi lệnh
4. **Handle errors** gracefully
5. **Auto-reconnect** khi phát hiện mất kết nối

---

## 📝 Changelog

### Version 2.0 (Current)
- ✅ Thêm global connection manager
- ✅ Tạo component RobotConnection
- ✅ API connect/disconnect/status
- ✅ Cập nhật robot command để dùng kết nối đã mở
- ✅ UI hiển thị trạng thái kết nối

### Version 1.0 (Old)
- Mở/đóng port mỗi lần gửi
- Chọn COM port ở mỗi chức năng
- Không có quản lý trạng thái

---

**📅 Cập nhật**: October 20, 2025  
**✍️ Tác giả**: GitHub Copilot  
**🎯 Mục đích**: Cải thiện quản lý kết nối serial port cho Robot
