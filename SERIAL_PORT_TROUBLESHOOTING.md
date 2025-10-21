# 🔧 Xử Lý Lỗi Serial Port

## ❌ Lỗi "Access Denied" 

### Nguyên nhân
Port COM đang bị giữ bởi:
1. Kết nối trước đó chưa đóng đúng cách
2. Ứng dụng khác đang dùng port
3. Driver COM port lỗi

### Giải pháp

#### 1. Force Cleanup (Nhanh nhất)
```
Giao diện Robot → Panel "Kết Nối Robot"
→ Click "🧹 Force Cleanup"
→ Đợi 2 giây
→ Kết nối lại
```

#### 2. Đổi COM Port
```
→ Thử COM1, COM2, COM3... đến COM8
→ Tìm port khả dụng
→ Kết nối
```

#### 3. Restart Server
```powershell
# Dừng server (Ctrl+C trong terminal)
npm run dev  # Start lại
```

#### 4. Restart VS Code / Terminal
```
Đóng tất cả terminal
→ Mở lại VS Code
→ npm run dev
```

#### 5. Kiểm tra Process đang dùng COM
```powershell
# Windows PowerShell
Get-Process | Where-Object {$_.MainWindowTitle -like "*COM*"}

# Hoặc dùng Device Manager
devmgmt.msc → Ports (COM & LPT)
```

---

## 🔄 Kết Nối Được Giữ Khi Chuyển Trang

### Cách Hoạt Động

1. **Zustand Global Store**
   - Lưu trạng thái kết nối: `isConnected`, `port`
   - Persist `lastConnectedPort` vào localStorage
   - Không bị mất khi chuyển trang

2. **Server-side Connection Manager**
   - `lib/serialPortManager.js` giữ port instance trong memory
   - Kết nối tồn tại suốt server session
   - Không bị đóng khi component unmount

3. **Auto-check Connection**
   - Mỗi trang check `/api/robot/status`
   - Nếu server vẫn connected → cập nhật UI
   - Nếu disconnect → hiển thị nút kết nối

### Test Flow

```
1. Vào /robot → Kết nối COM5
2. Chuyển sang /user → Vẫn connected
3. Chuyển sang /admin → Vẫn connected
4. Quay lại /robot → Vẫn connected
5. Gửi lệnh mượn/trả → Thành công
```

---

## 🐛 Debug Log

### Kiểm tra Connection Status
```javascript
// Browser console
fetch('/api/robot/status')
  .then(r => r.json())
  .then(console.log)

// Expected: { isConnected: true, port: "COM5", hasInstance: true }
```

### Kiểm tra Port Manager
```javascript
// Server log (terminal)
// Sau khi connect:
📡 Serial port updated: { portName: 'COM5', isOpen: true }

// Sau khi disconnect:
📡 Serial port cleared (was open: true)
```

### Force Close Port
```javascript
// Browser console (nếu cần)
fetch('/api/robot/cleanup', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

---

## 🔐 Best Practices

### DO ✅
1. **Kết nối một lần đầu phiên**
   - Vào /robot
   - Kết nối COM port
   - Dùng trong toàn bộ phiên làm việc

2. **Kiểm tra status trước khi gửi lệnh**
   - UI tự động check và hiển thị
   - Nếu chưa kết nối → hiển thị lỗi

3. **Ngắt kết nối khi xong việc**
   - Click "Ngắt kết nối"
   - Hoặc đóng browser (auto cleanup)

### DON'T ❌
1. **Không restart server khi đang connected**
   - Server restart → mất kết nối
   - Phải kết nối lại

2. **Không mở nhiều tab cùng lúc**
   - Mỗi tab có thể tạo kết nối riêng
   - Gây xung đột port

3. **Không disconnect/connect liên tục**
   - Có thể gây lỗi "Access denied"
   - Nếu cần test → dùng Force Cleanup

---

## 🚑 Emergency Recovery

### Nếu tất cả fail:

#### Windows:
```powershell
# 1. Kill tất cả Node process
taskkill /F /IM node.exe

# 2. Unplug và plug lại USB Serial adapter
# (nếu dùng USB-to-Serial)

# 3. Restart Device Manager
devmgmt.msc

# 4. Disable/Enable COM port
# Device Manager → Ports → Right-click → Disable
# Wait 3 seconds → Enable

# 5. Start server lại
cd D:\HK5\KHKT\library_robot
npm run dev
```

#### Nếu vẫn lỗi:
```
1. Restart máy tính
2. Kiểm tra driver COM port
3. Thử Arduino IDE để test port
4. Kiểm tra cáp/hardware
```

---

## 📊 Connection Lifecycle

```
┌─────────────────────────────────────────┐
│  1. User mở /robot                      │
│     → Component mount                    │
│     → Check status via API              │
│     → Update UI (connected/disconnected)│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. User click "Kết nối"                │
│     → POST /api/robot/connect           │
│     → Open serial port                  │
│     → Save to global manager            │
│     → Update Zustand store              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. User chuyển sang /user hoặc /admin  │
│     → Component unmount (OK)            │
│     → Server giữ port open             │
│     → Zustand store giữ state          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. User quay lại /robot                │
│     → Component remount                 │
│     → Check status → Still connected    │
│     → Update UI → Show "Đã kết nối"    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. User gửi lệnh mượn/trả              │
│     → POST /api/robot/command           │
│     → Dùng port đã mở                   │
│     → Write JSON → Arduino              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  6. User click "Ngắt kết nối"           │
│     → POST /api/robot/disconnect        │
│     → Close port                        │
│     → Clear global manager              │
│     → Update Zustand store              │
└─────────────────────────────────────────┘
```

---

## 📞 Support Checklist

Nếu gặp vấn đề, hãy cung cấp:

- [ ] OS & version (Windows 10/11?)
- [ ] COM port đang dùng (COM5?)
- [ ] Server log (terminal output)
- [ ] Browser console log
- [ ] Có dùng USB-to-Serial adapter không?
- [ ] Arduino đang chạy không?
- [ ] Đã thử Force Cleanup chưa?
- [ ] Đã thử đổi COM port chưa?
- [ ] Đã restart server chưa?

---

**📅 Cập nhật**: October 21, 2025  
**🔧 Version**: 2.1  
**✅ Status**: Production Ready
