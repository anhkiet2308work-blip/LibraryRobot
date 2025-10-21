import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import RobotConnection from '../components/RobotConnection'
import { getMQTTClient } from '../lib/MQTTClient'
import { getOrderById, borrowBooks, returnBooks } from '../lib/api'
import toast from 'react-hot-toast'

export default function RobotPage() {
  const router = useRouter()
  const [mode, setMode] = useState(null) // 'borrow' or 'return'
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)
  const [scannedRfids, setScannedRfids] = useState([])
  const [currentRfid, setCurrentRfid] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmBorrow, setShowConfirmBorrow] = useState(false) // Hiển thị confirm lấy sách
  const [mqttClient, setMqttClient] = useState(null)
  const [isRobotConnected, setIsRobotConnected] = useState(false)

  useEffect(() => {
    const client = getMQTTClient()
    setMqttClient(client)
    setIsRobotConnected(client.isConnected())

    const handleConnected = () => setIsRobotConnected(true)
    const handleDisconnected = () => setIsRobotConnected(false)

    client.on('mqtt_connected', handleConnected)
    client.on('mqtt_disconnected', handleDisconnected)

    return () => {
      client.off('mqtt_connected', handleConnected)
      client.off('mqtt_disconnected', handleDisconnected)
    }
  }, [])

  const handleSearchOrder = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = await getOrderById(parseInt(orderId))
      
      if (mode === 'borrow') {
        // Check if order is ordering (chưa lấy sách)
        if (orderData.status !== 'ordering') {
          toast.error('Đơn hàng này đã được xử lý hoặc không hợp lệ')
          setLoading(false)
          return
        }
        
        // Check if any book is already borrowed (no return timestamp)
        const alreadyBorrowed = orderData.order_detail.some(d => !d.return_timestamp)
        if (!alreadyBorrowed) {
          toast.error('Tất cả sách trong đơn hàng này đã được mượn trước đó')
          setLoading(false)
          return
        }
      } else {
        // For return mode, check if there are unreturned books
        const unreturnedBooks = orderData.order_detail.filter(d => !d.return_timestamp)
        if (unreturnedBooks.length === 0) {
          toast.error('Không có sách nào cần trả trong đơn hàng này')
          setLoading(false)
          return
        }
      }

      setOrder(orderData)
      toast.success(`Đã tìm thấy đơn hàng #${orderId}`)
      
      // Nếu là chế độ borrow, hiển thị nút "Tiến hành lấy sách"
      if (mode === 'borrow') {
        setShowConfirmBorrow(true)
      }
    } catch (error) {
      toast.error('Không tìm thấy đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  // Gửi lệnh lấy sách đến robot VÀ HOÀN TẤT LUÔN
  const handleProceedBorrow = async () => {
    if (!order || !mqttClient) return
    
    setLoading(true)
    let mqttSuccess = false
    
    try {
      // Lấy tất cả sách trong đơn chưa được mượn
      const booksToFetch = order.order_detail
        .filter(d => !d.return_timestamp)
        .map((d, index) => ({
          sequence: index + 1,
          rfid: d.rfid,
          name: d.book.name,
          position: {
            x: d.book.position_x,
            y: d.book.position_y,
            z: d.book.position_z
          }
        }))
      
      // Kiểm tra kết nối MQTT
      if (!isRobotConnected) {
        toast.error('❌ MQTT chưa kết nối! Vui lòng kết nối MQTT trước.')
        setLoading(false)
        setShowConfirmBorrow(false)
        return
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📡 BƯỚC 1: Chuẩn bị gửi lệnh lấy sách qua MQTT')
      console.log('   Đơn hàng:', `#${order.order_id}`)
      console.log('   MQTT Topic:', 'robot_thu_vien/command')
      console.log('   Số lượng sách:', booksToFetch.length)
      console.log('   Danh sách:', booksToFetch.map(b => `${b.name} (${b.rfid})`).join(', '))
      
      // Gửi lệnh đến robot qua MQTT
      mqttSuccess = await mqttClient.sendCommand('borrow', booksToFetch)
      
      console.log('✅ BƯỚC 2: MQTT message đã publish')
      console.log('   Success:', mqttSuccess)
      
      // CHỈ gọi API borrow nếu gửi MQTT thành công
      if (mqttSuccess) {
        const borrowResult = await fetch('/api/robot/borrow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId: order.order_id
          })
        })
        
        const borrowData = await borrowResult.json()
        
        if (!borrowResult.ok) {
          throw new Error(borrowData.error || 'Không thể hoàn tất')
        }
        
        console.log('✅ BƯỚC 3: Cập nhật trạng thái đơn hàng')
        console.log('   Status Change:', borrowData.statusChanged)
        console.log('   Message:', borrowData.message)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        toast.success(
          `✅ Hoàn tất!\n📡 Đã gửi lệnh qua MQTT\n📝 ${borrowData.statusChanged || 'Đơn hàng: ordering → pending'}`,
          { duration: 5000 }
        )
        
        // Reset về trang chủ sau 2 giây
        setTimeout(() => {
          setMode(null)
          setOrderId('')
          setOrder(null)
          setScannedRfids([])
          setShowConfirmBorrow(false)
        }, 2000)
      } else {
        throw new Error('Gửi MQTT message thất bại!')
      }
      
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ LỖI khi gửi lệnh lấy sách')
      console.error('   Error Message:', error.message)
      console.error('   MQTT Success:', mqttSuccess)
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      toast.error('❌ Lỗi: ' + error.message, { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const handleScanRfid = (e) => {
    e.preventDefault()
    
    // Trim và normalize RFID
    const cleanRfid = currentRfid.trim()
    
    if (!cleanRfid) {
      toast.error('Vui lòng quét RFID')
      return
    }

    // Debug: Log để kiểm tra chi tiết
    console.log('🔍 RFID đã quét:', {
      original: currentRfid,
      cleaned: cleanRfid,
      type: typeof cleanRfid,
      length: cleanRfid.length,
      charCodes: cleanRfid.split('').map(c => c.charCodeAt(0))
    })
    
    console.log('📚 RFIDs trong đơn:', order.order_detail.map(d => ({
      rfid: d.rfid, 
      type: typeof d.rfid,
      length: String(d.rfid).length,
      bookName: d.book.name
    })))

    // Normalize function: trim và convert về string
    const normalize = (val) => String(val).trim()
    
    // Check if RFID is in the order (so sánh sau khi normalize)
    const bookInOrder = order.order_detail.find(d => 
      normalize(d.rfid) === normalize(cleanRfid)
    )
    
    if (!bookInOrder) {
      toast.error(`Sách RFID "${cleanRfid}" không thuộc đơn hàng này`)
      console.log('❌ Không tìm thấy sách với RFID:', cleanRfid)
      console.log('❌ So sánh chi tiết:')
      order.order_detail.forEach(d => {
        console.log(`   - DB: "${d.rfid}" (${d.rfid.length} chars) vs Input: "${cleanRfid}" (${cleanRfid.length} chars)`)
        console.log(`   - Match: ${normalize(d.rfid) === normalize(cleanRfid)}`)
      })
      setCurrentRfid('')
      return
    }
    
    console.log('✅ Tìm thấy sách:', bookInOrder.book.name)
    
    // Update currentRfid to cleaned version
    setCurrentRfid(cleanRfid)

    // For return mode, check if book was borrowed
    if (mode === 'return' && bookInOrder.return_timestamp) {
      toast.error('❌ Sách này đã được trả trước đó')
      console.log('❌ Book already returned:', bookInOrder.book.name)
      setCurrentRfid('')
      return
    }

    // Check if already scanned (dùng normalize để so sánh)
    const alreadyScanned = scannedRfids.some(rfid => normalize(rfid) === normalize(cleanRfid))
    if (alreadyScanned) {
      toast.error('❌ Sách này đã được quét rồi! Không thể quét trùng.', { duration: 4000 })
      console.log('❌ Duplicate RFID scan rejected:', cleanRfid, bookInOrder.book.name)
      setCurrentRfid('')
      return
    }

    // Lưu RFID đã clean - CHỈ khi chưa quét
    setScannedRfids([...scannedRfids, cleanRfid])
    toast.success(`✓ Đã quét: ${bookInOrder.book.name}`)
    console.log('✅ Valid RFID added:', cleanRfid, bookInOrder.book.name)
    setCurrentRfid('')
  }

  const handleConfirm = async () => {
    if (scannedRfids.length === 0) {
      toast.error('Chưa quét RFID nào')
      return
    }

    setLoading(true)

    try {
      if (mode === 'borrow') {
        await borrowBooks(order.order_id)
        toast.success(`Đã mượn ${scannedRfids.length} sách thành công!`)
      } else {
        // CHẾ ĐỘ TRẢ SÁCH: Gửi vị trí theo thứ tự RFID được quét
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📥 BƯỚC 1: Chuẩn bị trả sách')
        console.log('   Đơn hàng:', `#${order.order_id}`)
        console.log('   MQTT Topic:', 'robot_thu_vien/command')
        console.log('   Số lượng:', scannedRfids.length)
        console.log('   Thứ tự quét:', scannedRfids.join(', '))
        
        // Tạo danh sách sách theo thứ tự quét
        const booksInOrder = scannedRfids.map((rfid, index) => {
          const detail = order.order_detail.find(d => 
            String(d.rfid).trim() === String(rfid).trim()
          )
          if (!detail) {
            console.error('❌ RFID not found in order:', rfid)
            throw new Error(`RFID ${rfid} không tìm thấy trong đơn hàng`)
          }
          return {
            sequence: index + 1,
            rfid: detail.rfid,
            name: detail.book.name,
            position: {
              x: detail.book.position_x,
              y: detail.book.position_y,
              z: detail.book.position_z
            }
          }
        })
        
        // Kiểm tra kết nối MQTT
        if (!isRobotConnected || !mqttClient) {
          toast.error('❌ MQTT chưa kết nối! Vui lòng kết nối MQTT trước.')
          setLoading(false)
          return
        }

        console.log('📡 BƯỚC 2: Gửi JSON đến robot qua MQTT theo thứ tự quét')
        console.log('   Topic:', 'robot_thu_vien/command')
        booksInOrder.forEach((book, i) => {
          console.log(`   ${i+1}. ${book.name} → X=${book.position.x}, Y=${book.position.y}, Z=${book.position.z}`)
        })
        
        // Gửi vị trí đến robot qua MQTT
        const mqttSuccess = await mqttClient.sendCommand('return', booksInOrder)
        
        console.log('✅ BƯỚC 3: MQTT message đã publish')
        console.log('   Success:', mqttSuccess)
        
        if (!mqttSuccess) {
          throw new Error('Gửi MQTT message thất bại!')
        }
        
        // Cập nhật database SAU KHI gửi MQTT thành công
        await returnBooks(order.order_id, scannedRfids)
        console.log('✅ BƯỚC 4: Đã cập nhật database')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        
        toast.success(
          `✅ Hoàn tất!\n📥 Đã trả ${scannedRfids.length} sách\n📡 Đã gửi lệnh qua MQTT`,
          { duration: 5000 }
        )
      }

      // Reset
      setMode(null)
      setOrderId('')
      setOrder(null)
      setScannedRfids([])
      setShowConfirmBorrow(false)
    } catch (error) {
      toast.error('Có lỗi xảy ra: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setMode(null)
    setOrderId('')
    setOrder(null)
    setScannedRfids([])
    setCurrentRfid('')
    setShowConfirmBorrow(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🤖 Robot Interface</h1>
          <p className="text-white text-lg">Giao diện quản lý mượn trả sách tự động</p>
          
          <Button onClick={() => router.push('/')} variant="outline" className="mt-4 bg-white">
            ← Quay lại trang chủ
          </Button>
        </div>

        {/* Robot Connection Panel */}
        <RobotConnection />

        {/* Mode Selection */}
        {!mode && (
          <Card title="Chọn Chức Năng">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode('borrow')}
                className="p-8 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-blue-50 transition-all"
              >
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-2xl font-bold mb-2">Mượn Sách</h3>
                <p className="text-gray-600">Lấy sách từ kho cho người dùng</p>
              </button>

              <button
                onClick={() => setMode('return')}
                className="p-8 border-2 border-gray-300 rounded-lg hover:border-secondary hover:bg-green-50 transition-all"
              >
                <div className="text-6xl mb-4">📥</div>
                <h3 className="text-2xl font-bold mb-2">Trả Sách</h3>
                <p className="text-gray-600">Nhận sách trả lại từ người dùng</p>
              </button>
            </div>
          </Card>
        )}

        {/* Order Input */}
        {mode && !order && (
          <Card title={mode === 'borrow' ? '📤 Mượn Sách' : '📥 Trả Sách'}>
            <form onSubmit={handleSearchOrder}>
              <Input
                label="Nhập mã đơn hàng"
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ví dụ: 12345"
                required
              />
              <div className="flex space-x-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Đang tìm...' : 'Tìm đơn hàng'}
                </Button>
                <Button type="button" onClick={handleCancel} variant="outline" className="flex-1">
                  Hủy
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* RFID Scanning */}
        {mode && order && (
          <div className="space-y-4">
            {/* Order Info */}
            <Card title={`Đơn hàng #${order.order_id}`}>
              <div className="mb-4">
                <p className="text-gray-600">Người dùng: <span className="font-medium">{order.users.email}</span></p>
                <p className="text-gray-600">Thời gian: <span className="font-medium">{new Date(order.ts_created).toLocaleString('vi-VN')}</span></p>
                <p className="text-gray-600">
                  Trạng thái: <span className={`font-medium ${
                    order.status === 'completed' ? 'text-green-600' : 
                    order.status === 'ordering' ? 'text-orange-600' : 
                    'text-yellow-600'
                  }`}>
                    {order.status === 'completed' ? 'Đã hoàn thành' : 
                     order.status === 'ordering' ? 'Đang xử lý' : 
                     'Đang mượn'}
                  </span>
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Danh sách sách:</h3>
                <div className="space-y-2">
                  {order.order_detail.map((detail, idx) => {
                    const isScanned = scannedRfids.includes(detail.rfid)
                    const needsAction = mode === 'return' ? !detail.return_timestamp : true
                    
                    return (
                      <div key={idx} className={`flex justify-between items-center p-3 rounded ${
                        isScanned ? 'bg-green-100 border-2 border-green-500' : needsAction ? 'bg-white border border-gray-300' : 'bg-gray-200'
                      }`}>
                        <div className="flex-1">
                          <p className="font-bold text-lg">{detail.book.name}</p>
                          {detail.book.position_x !== null && (
                            <p className="text-sm text-gray-600 mt-1">
                              📍 Vị trí: X={detail.book.position_x}, Y={detail.book.position_y}, Z={detail.book.position_z}
                            </p>
                          )}
                        </div>
                        {isScanned && (
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">✓</span>
                            <span className="text-green-700 font-bold">Đã quét</span>
                          </div>
                        )}
                        {!isScanned && !needsAction && <span className="text-gray-500">Đã xử lý</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Nút "Tiến hành lấy sách" cho chế độ borrow */}
              {mode === 'borrow' && showConfirmBorrow && (
                <div className="mt-4 flex space-x-3">
                  <Button 
                    onClick={handleProceedBorrow} 
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? '⏳ Đang gửi lệnh...' : '🤖 Tiến hành lấy sách'}
                  </Button>
                  <Button 
                    onClick={handleCancel} 
                    variant="outline"
                    className="flex-1"
                  >
                    ❌ Quay lại
                  </Button>
                </div>
              )}
            </Card>

            {/* RFID Scanner - Chỉ hiển thị khi không ở chế độ confirm borrow */}
            {!(mode === 'borrow' && showConfirmBorrow) && (
            <Card title="🔍 Quét RFID">
              <form onSubmit={handleScanRfid}>
                <Input
                  label="Quét mã RFID (mã sẽ tự động ẩn)"
                  type="password"
                  value={currentRfid}
                  onChange={(e) => {
                    // Trim và làm sạch RFID
                    const cleanRfid = e.target.value.trim()
                    setCurrentRfid(cleanRfid)
                    console.log('📝 RFID input:', {
                      raw: e.target.value,
                      cleaned: cleanRfid,
                      length: cleanRfid.length,
                      charCodes: cleanRfid.split('').map(c => c.charCodeAt(0))
                    })
                  }}
                  placeholder="Quét RFID bằng thiết bị..."
                  autoFocus
                  autoComplete="off"
                />
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-lg font-bold text-blue-900">
                    Đã quét: {scannedRfids.length} / {
                      mode === 'return' 
                        ? order.order_detail.filter(d => !d.return_timestamp).length 
                        : order.order_detail.length
                    } sách
                  </p>
                  {scannedRfids.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {scannedRfids.map((rfid, idx) => {
                        const book = order.order_detail.find(d => d.rfid === rfid)
                        return (
                          <div key={idx} className="text-sm text-green-700 flex items-center space-x-2">
                            <span>✓</span>
                            <span className="font-medium">{book?.book.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 italic">
                  💡 Mẹo: Sử dụng thiết bị quét RFID (HID), mã sẽ tự động được ẩn và thông tin sách sẽ hiển thị bên trên.
                </p>
                <Button type="submit" variant="secondary" className="w-full mb-3">
                  ➕ Xác nhận quét
                </Button>
              </form>

              <div className="flex space-x-3">
                <Button
                  onClick={handleConfirm}
                  disabled={scannedRfids.length === 0 || loading}
                  className="flex-1"
                >
                  {loading ? 'Đang xử lý...' : `✓ Xác nhận ${mode === 'borrow' ? 'mượn' : 'trả'} (${scannedRfids.length})`}
                </Button>
                <Button onClick={handleCancel} variant="danger" className="flex-1">
                  ✕ Hủy
                </Button>
              </div>
            </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
