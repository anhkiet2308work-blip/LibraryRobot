# SerialConnector - Module Kết Nối Serial/COM Ổn Định

## 📋 Tổng quan

**SerialConnector** là module backend độc lập để quản lý kết nối Serial/COM với Arduino/Robot, giải quyết các vấn đề:
- ❌ "Access denied" / "Port busy" khi mở lại port
- ❌ Handle không được nhả sau khi đóng
- ❌ Buffer còn dữ liệu cũ
- ❌ DTR/RTS gây auto-reset ngoài ý muốn
- ❌ Không retry khi lỗi tạm thời

## ✨ Tính năng

- ✅ **Clean Open/Close**: Thả DTR/RTS, xả buffer, delay để OS nhả handle
- ✅ **Retry với Backoff**: 5 lần retry với delay 100→200→300→500→1000ms
- ✅ **Thread-safe**: Singleton pattern, chỉ 1 kết nối duy nhất
- ✅ **Force Cleanup**: Dọn dẹp cưỡng bức khi port bị stuck
- ✅ **Cross-platform**: Hỗ trợ COMx (Windows) và /dev/ttyUSB* (Linux/macOS)
- ✅ **Log chi tiết**: INFO/WARN/ERROR với ngữ cảnh đầy đủ

---

## 🚀 Hướng dẫn sử dụng (3 bước)

### 1. Import module

```javascript
import { getSerialConnector } from '../lib/SerialConnector'
```

### 2. Kết nối port

```javascript
const connector = getSerialConnector()

try {
  await connector.openPort({
    portName: 'COM5',        // Hoặc '/dev/ttyUSB0'
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    maxRetries: 5,
    retryDelays: [100, 200, 300, 500, 1000]
  })
  
  console.log('✅ Đã kết nối!')
} catch (error) {
  console.error('❌ Lỗi kết nối:', error.message)
}
```

### 3. Gửi dữ liệu và đóng

```javascript
// Gửi dữ liệu
await connector.write(JSON.stringify({ hello: 'robot' }) + '\n')

// Đóng khi xong
await connector.closePort() // Graceful close
// Hoặc
await connector.closePort(true) // Force close (nhanh hơn)
```

---

## 📚 API Reference

### `getSerialConnector()`
Lấy singleton instance của SerialConnector.

**Returns**: `SerialConnector`

---

### `listPorts()`
Liệt kê tất cả cổng COM khả dụng.

**Returns**: `Promise<Array>` - Danh sách ports với `path`, `manufacturer`, etc.

**Example**:
```javascript
const ports = await connector.listPorts()
// [
//   { path: 'COM5', manufacturer: 'Arduino LLC' },
//   { path: 'COM3', manufacturer: 'FTDI' }
// ]
```

---

### `portExists(portName)`
Kiểm tra port có tồn tại không.

**Parameters**:
- `portName` (string): Tên port (COM5, /dev/ttyUSB0)

**Returns**: `Promise<boolean>`

---

### `openPort(options)`
Mở cổng với retry & backoff logic.

**Parameters**:
- `options.portName` (string, **required**): Tên port
- `options.baudRate` (number, default: 9600): Baud rate
- `options.dataBits` (number, default: 8): Data bits
- `options.parity` (string, default: 'none'): Parity (none/even/odd)
- `options.stopBits` (number, default: 1): Stop bits
- `options.maxRetries` (number, default: 5): Số lần retry
- `options.retryDelays` (Array, default: [100,200,300,500,1000]): Backoff delays (ms)

**Returns**: `Promise<Object>` - SerialPort instance

**Throws**: 
- `Error` nếu port không tồn tại
- `Error` nếu hết retry vẫn không mở được (với hướng dẫn fix)

**Example**:
```javascript
await connector.openPort({
  portName: 'COM5',
  baudRate: 115200
})
```

---

### `closePort(force = false)`
Đóng port với cleanup chuẩn.

**Parameters**:
- `force` (boolean, default: false): `true` = force close ngay, `false` = graceful close

**Returns**: `Promise<void>`

**Workflow**:
1. Dừng tất cả readers
2. Thả DTR/RTS = false
3. Xả buffer
4. Close port (với timeout 1.5s nếu graceful)
5. Destroy nếu vẫn còn mở
6. Clear instance
7. **Delay 150-300ms** để OS nhả handle

**Example**:
```javascript
// Graceful close (khuyến nghị)
await connector.closePort()

// Force close (khi cần nhanh)
await connector.closePort(true)
```

---

### `isOpen()`
Kiểm tra port có đang mở không.

**Returns**: `boolean`

---

### `getPort()`
Lấy port instance để thao tác trực tiếp (nâng cao).

**Returns**: `Object` - SerialPort instance

**Throws**: `Error` nếu port chưa mở

---

### `write(data)`
Ghi dữ liệu vào port.

**Parameters**:
- `data` (string | Buffer): Dữ liệu ghi

**Returns**: `Promise<void>`

**Throws**: `Error` nếu port chưa mở

**Example**:
```javascript
await connector.write('Hello Robot\n')
await connector.write(Buffer.from([0x01, 0x02, 0x03]))
```

---

### `readLine(timeout = 5000)`
Đọc một dòng từ port (line-based, kết thúc bằng `\n`).

**Parameters**:
- `timeout` (number, default: 5000): Timeout (ms)

**Returns**: `Promise<string>` - Dòng dữ liệu (không bao gồm `\n`)

**Throws**: 
- `Error` nếu port chưa mở
- `Error` nếu timeout

**Example**:
```javascript
const line = await connector.readLine()
console.log('Arduino says:', line)
```

---

## ✅ Checklist Kiểm Thử

### Test 1: Mở port hợp lệ thành công
```javascript
const connector = getSerialConnector()
await connector.openPort({ portName: 'COM5' })
console.assert(connector.isOpen() === true, '❌ Port should be open')
console.log('✅ Test 1 passed')
```

**Kết quả mong đợi**: Console log hiển thị:
```
🔌 Opening port: COM5
   Baud: 9600
   Verifying port exists...
   Attempt 1/5...
   Setting DTR/RTS = false...
   Flushing buffers...
✅ Port opened successfully
```

---

### Test 2: Mở port đang bận → retry → báo lỗi
```javascript
// Mở port lần 1 (thành công)
const connector1 = getSerialConnector()
await connector1.openPort({ portName: 'COM5' })

// Thử mở port lần 2 (từ process khác hoặc browser tab khác)
// → Sẽ retry 5 lần với backoff, cuối cùng throw error
```

**Kết quả mong đợi**:
```
⚠️ Attempt 1 failed: Access denied
   Retrying in 100ms...
⚠️ Attempt 2 failed: Access denied
   Retrying in 200ms...
...
❌ Open port failed: Port COM5 is busy (Access denied). Possible causes:
  1. Another program is using this port
  2. Previous connection not fully closed
  3. USB device issue
Solutions:
  - Close other programs using the port
  - Wait 5 seconds and try again
  - Try a different COM port
  - Unplug and replug USB device
```

---

### Test 3: Close() rồi Open() lại 10 lần liên tiếp
```javascript
const connector = getSerialConnector()

for (let i = 1; i <= 10; i++) {
  console.log(`\n=== Iteration ${i}/10 ===`)
  
  await connector.openPort({ portName: 'COM5' })
  console.assert(connector.isOpen() === true, '❌ Should be open')
  
  await connector.closePort()
  console.assert(connector.isOpen() === false, '❌ Should be closed')
  
  // Đợi 500ms giữa các lần (để chắc chắn OS nhả handle)
  await new Promise(resolve => setTimeout(resolve, 500))
}

console.log('✅ Test 3 passed: 10 open/close cycles successful')
```

**Kết quả mong đợi**: Không có lỗi "Access denied", mỗi lần đều mở thành công.

---

### Test 4: Gửi và nhận dữ liệu
```javascript
const connector = getSerialConnector()
await connector.openPort({ portName: 'COM5' })

// Gửi command
await connector.write('{"action":"borrow"}\n')
console.log('✅ Data sent')

// Đọc response (nếu Arduino trả về)
try {
  const response = await connector.readLine(3000)
  console.log('✅ Arduino response:', response)
} catch (err) {
  console.log('⚠️ No response (timeout):', err.message)
}

await connector.closePort()
```

---

### Test 5: Force cleanup khi port stuck
```javascript
// Giả lập port bị stuck (mở nhưng không close được)
const connector = getSerialConnector()
await connector.openPort({ portName: 'COM5' })

// Giả lập lỗi: rút USB mà không close
// Hoặc: kill process đột ngột
// → Port vẫn bị giữ trong OS

// Force cleanup
try {
  await connector.closePort(true) // Force = true
  console.log('✅ Force cleanup successful')
} catch (err) {
  console.error('❌ Force cleanup failed:', err.message)
}

// Đợi 500ms
await new Promise(resolve => setTimeout(resolve, 500))

// Thử mở lại
await connector.openPort({ portName: 'COM5' })
console.assert(connector.isOpen() === true, '❌ Should be able to reopen')
console.log('✅ Test 5 passed')
```

---

## 🔧 Xử lý lỗi thường gặp

### Lỗi: "Access denied" / "Port busy"

**Nguyên nhân**:
1. Port đang được chương trình khác sử dụng (Arduino IDE, PuTTY, etc.)
2. Kết nối trước đó không được đóng đúng cách
3. OS chưa nhả handle (cần delay)
4. USB device có vấn đề

**Giải pháp**:
1. Đóng tất cả chương trình khác đang dùng port
2. Chờ 5 giây rồi thử lại
3. Gọi **Force Cleanup**:
   ```javascript
   await connector.closePort(true)
   await new Promise(resolve => setTimeout(resolve, 500))
   await connector.openPort({ portName: 'COM5' })
   ```
4. Rút và cắm lại USB
5. Thử port khác (COM3, COM4, ...)

---

### Lỗi: "Port not found"

**Nguyên nhân**:
- Port không tồn tại
- Sai tên port (COM5 vs /dev/ttyUSB0)
- USB chưa được cắm

**Giải pháp**:
```javascript
const ports = await connector.listPorts()
console.log('Available ports:', ports.map(p => p.path))
// Chọn port đúng từ danh sách
```

---

### Lỗi: "Write error: Port is not open"

**Nguyên nhân**:
- Gọi `write()` khi port chưa mở
- Port bị đóng đột ngột (rút USB)

**Giải pháp**:
```javascript
if (!connector.isOpen()) {
  await connector.openPort({ portName: 'COM5' })
}
await connector.write('data')
```

---

## 🎯 Nguyên tắc thiết kế

### 1. Clean Open
- Kiểm tra port tồn tại trước khi mở
- Đóng port cũ nếu còn tồn tại
- Đặt DTR/RTS = false để tránh Arduino auto-reset
- Xả buffer để bắt đầu "sạch"

### 2. Retry với Backoff
- Không fail ngay lần đầu (lỗi tạm thời có thể tự hồi phục)
- Backoff tăng dần: 100ms → 200ms → 300ms → 500ms → 1000ms
- Tổng thời gian retry: ~2 giây

### 3. Clean Close
- Dừng tất cả readers/listeners
- Thả DTR/RTS
- Xả buffer
- Close với timeout (graceful)
- Destroy nếu vẫn không đóng (force)
- **Delay 150-300ms** để OS nhả handle (CRITICAL!)

### 4. Thread-safe
- Singleton pattern: chỉ 1 instance
- Cờ `isConnecting` để tránh open đồng thời
- Kiểm tra trạng thái real-time (không cache)

---

## 📊 So sánh với code cũ

| Vấn đề | Code cũ | SerialConnector mới |
|--------|---------|---------------------|
| Access denied | ❌ Fail ngay | ✅ Retry 5 lần với backoff |
| Handle không nhả | ❌ Không có delay | ✅ Delay 150-300ms sau close |
| DTR/RTS reset | ❌ Không control | ✅ Đặt false rõ ràng |
| Buffer còn data | ❌ Không xả | ✅ Flush buffer ngay sau mở |
| Port busy | ❌ Lỗi không rõ ràng | ✅ Lỗi có hướng dẫn fix chi tiết |
| Force cleanup | ❌ Không có | ✅ closePort(true) |
| Mở lại port | ❌ Cần rút USB | ✅ Mở lại ngay không cần rút |

---

## 🔍 Debug Tips

### Bật log chi tiết
Module tự động log mọi bước, bạn chỉ cần xem console:

```
🔌 Opening port: COM5
   Baud: 9600
   Verifying port exists...
   Attempt 1/5...
   Setting DTR/RTS = false...
   Flushing buffers...
✅ Port opened successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Kiểm tra port có mở không
```javascript
console.log('Is open?', connector.isOpen())
console.log('Port name:', connector.portName)
```

### Kiểm tra port tồn tại
```javascript
const exists = await connector.portExists('COM5')
console.log('COM5 exists?', exists)
```

### Liệt kê tất cả ports
```javascript
const ports = await connector.listPorts()
console.table(ports)
```

---

## 📝 Ví dụ đầy đủ

```javascript
import { getSerialConnector } from './lib/SerialConnector'

async function main() {
  const connector = getSerialConnector()

  try {
    // 1. Liệt kê ports
    console.log('📋 Available ports:')
    const ports = await connector.listPorts()
    console.table(ports)

    // 2. Kết nối
    console.log('\n🔌 Connecting to COM5...')
    await connector.openPort({
      portName: 'COM5',
      baudRate: 9600
    })

    // 3. Gửi dữ liệu
    console.log('\n📤 Sending data...')
    const payload = { action: 'borrow', books: [1, 2, 3] }
    await connector.write(JSON.stringify(payload) + '\n')

    // 4. Đọc response (optional)
    console.log('\n📥 Reading response...')
    try {
      const response = await connector.readLine(3000)
      console.log('Arduino says:', response)
    } catch (err) {
      console.log('No response (timeout)')
    }

    // 5. Đóng
    console.log('\n🔌 Closing port...')
    await connector.closePort()

    console.log('\n✅ Done!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    
    // Cleanup khi lỗi
    if (connector.isOpen()) {
      await connector.closePort(true)
    }
  }
}

main()
```

---

## 🛠️ Integration với API routes hiện tại

Module này đã được tích hợp vào các API routes:

- ✅ `/api/robot/connect` - Sử dụng `connector.openPort()`
- ✅ `/api/robot/disconnect` - Sử dụng `connector.closePort()`
- ✅ `/api/robot/status` - Sử dụng `connector.isOpen()`
- ✅ `/api/robot/cleanup` - Sử dụng `connector.closePort(true)`
- ✅ `/api/robot/command` - Sử dụng `connector.write()`

**Không cần thay đổi code UI**, các component cũ vẫn hoạt động bình thường!

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra log console (có nhiều thông tin debug)
2. Thử force cleanup: `closePort(true)`
3. Rút USB, chờ 5 giây, cắm lại
4. Kiểm tra Device Manager (Windows) xem port có bị lỗi không
5. Thử port khác

---

**Author**: GitHub Copilot  
**Version**: 1.0.0  
**Last Updated**: 2025-01-21
