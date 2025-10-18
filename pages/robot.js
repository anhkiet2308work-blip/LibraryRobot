import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
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

  const handleSearchOrder = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = await getOrderById(parseInt(orderId))
      
      if (mode === 'borrow') {
        // Check if order is pending
        if (orderData.status !== 'pending') {
          toast.error('Đơn hàng này đã được xử lý')
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
    } catch (error) {
      toast.error('Không tìm thấy đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleScanRfid = (e) => {
    e.preventDefault()
    
    if (!currentRfid) {
      toast.error('Vui lòng nhập RFID')
      return
    }

    // Check if RFID is in the order
    const bookInOrder = order.order_detail.find(d => d.rfid === currentRfid)
    if (!bookInOrder) {
      toast.error('RFID này không thuộc đơn hàng')
      return
    }

    // For return mode, check if book was borrowed
    if (mode === 'return' && bookInOrder.return_timestamp) {
      toast.error('Sách này đã được trả trước đó')
      return
    }

    // Check if already scanned
    if (scannedRfids.includes(currentRfid)) {
      toast.error('RFID này đã được quét')
      return
    }

    setScannedRfids([...scannedRfids, currentRfid])
    toast.success(`✓ Đã quét: ${bookInOrder.book.name}`)
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
        await returnBooks(order.order_id, scannedRfids)
        toast.success(`Đã trả ${scannedRfids.length} sách thành công!`)
      }

      // Reset
      setMode(null)
      setOrderId('')
      setOrder(null)
      setScannedRfids([])
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
                  Trạng thái: <span className={`font-medium ${order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.status === 'completed' ? 'Đã hoàn thành' : 'Đang mượn'}
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
                      <div key={idx} className={`flex justify-between items-center p-2 rounded ${
                        isScanned ? 'bg-green-100' : needsAction ? 'bg-white' : 'bg-gray-200'
                      }`}>
                        <div>
                          <p className="font-medium">{detail.book.name}</p>
                          <p className="text-sm text-gray-600">RFID: {detail.rfid}</p>
                          {detail.book.position_x !== null && (
                            <p className="text-xs text-gray-500">
                              Vị trí: ({detail.book.position_x}, {detail.book.position_y}, {detail.book.position_z})
                            </p>
                          )}
                        </div>
                        {isScanned && <span className="text-green-600 font-bold">✓ Đã quét</span>}
                        {!isScanned && !needsAction && <span className="text-gray-500">Đã xử lý</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>

            {/* RFID Scanner */}
            <Card title="Quét RFID">
              <form onSubmit={handleScanRfid}>
                <Input
                  label="Nhập hoặc quét mã RFID"
                  value={currentRfid}
                  onChange={(e) => setCurrentRfid(e.target.value)}
                  placeholder="Quét mã RFID..."
                  autoFocus
                />
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="font-medium">Đã quét: {scannedRfids.length} / {
                    mode === 'return' 
                      ? order.order_detail.filter(d => !d.return_timestamp).length 
                      : order.order_detail.length
                  } sách</p>
                </div>
                <Button type="submit" variant="secondary" className="w-full mb-3">
                  ➕ Quét RFID
                </Button>
              </form>

              <div className="flex space-x-3">
                <Button
                  onClick={handleConfirm}
                  disabled={scannedRfids.length === 0 || loading}
                  className="flex-1"
                >
                  {loading ? 'Đang xử lý...' : `✓ Xác nhận ${mode === 'borrow' ? 'mượn' : 'trả'}`}
                </Button>
                <Button onClick={handleCancel} variant="danger" className="flex-1">
                  ✕ Hủy
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
