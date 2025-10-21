import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import { getCurrentUser, getAvailableBooks, createOrder, getBorrowHistory, getUserStatistics, deleteOrder } from '../lib/api'
import toast from 'react-hot-toast'
import MonthlyBorrowingChart from '../components/MonthlyBorrowingChart'
import ReturnStatusChart from '../components/ReturnStatusChart'

export default function UserPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [books, setBooks] = useState([])
  const [cart, setCart] = useState([])
  const [history, setHistory] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [statsPeriod, setStatsPeriod] = useState('month') // month hoặc week
  const [activeTab, setActiveTab] = useState('browse') // browse, cart, history, statistics
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser || currentUser.role !== 'user') {
        router.push('/')
        return
      }
      setUser(currentUser)
      loadData(currentUser)
    }
    checkAuth()
  }, [])

  const loadData = async (currentUser, period = 'month') => {
    try {
      const [booksData, historyData, statsData] = await Promise.all([
        getAvailableBooks(),
        getBorrowHistory(currentUser.user_id),
        getUserStatistics(currentUser.user_id, period)
      ])
      setBooks(booksData)
      setHistory(historyData)
      setStatistics(statsData)
    } catch (error) {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = async (newPeriod) => {
    setStatsPeriod(newPeriod)
    try {
      const statsData = await getUserStatistics(user.user_id, newPeriod)
      setStatistics(statsData)
    } catch (error) {
      toast.error('Không thể tải thống kê')
    }
  }

  const addToCart = (book) => {
    if (cart.find(b => b.rfid === book.rfid)) {
      toast.error('Sách đã có trong giỏ hàng')
      return
    }
    setCart([...cart, book])
    toast.success(`Đã thêm "${book.name}" vào giỏ hàng`)
  }

  const removeFromCart = (rfid) => {
    setCart(cart.filter(book => book.rfid !== rfid))
    toast.success('Đã xóa khỏi giỏ hàng')
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error('Giỏ hàng trống')
      return
    }

    try {
      const rfids = cart.map(book => book.rfid)
      const order = await createOrder(user.user_id, rfids)
      
      toast.success(`Đã tạo đơn hàng #${order.order_id}. Vui lòng đến robot để lấy sách!`, {
        duration: 5000
      })
      
      setCart([])
      setActiveTab('history')
      
      // Reload history
      const historyData = await getBorrowHistory(user.user_id)
      setHistory(historyData)
      
      // ✅ Reload books để cập nhật book_lefts
      const booksData = await getAvailableBooks()
      setBooks(booksData)
    } catch (error) {
      toast.error('Không thể tạo đơn hàng: ' + error.message)
    }
  }

  const handleDeleteOrder = async (orderId, orderStatus) => {
    // Chỉ cho phép xóa đơn ở trạng thái 'ordering' (chưa lấy sách)
    if (orderStatus !== 'ordering') {
      toast.error('Chỉ có thể xóa đơn hàng đang xử lý (chưa lấy sách)')
      return
    }

    if (!confirm(`Bạn có chắc muốn xóa đơn hàng #${orderId}?`)) {
      return
    }

    try {
      await deleteOrder(orderId)
      toast.success('Đã xóa đơn hàng')
      
      // Reload history và books
      const [historyData, booksData] = await Promise.all([
        getBorrowHistory(user.user_id),
        getAvailableBooks()
      ])
      setHistory(historyData)
      setBooks(booksData)
    } catch (error) {
      toast.error('Không thể xóa đơn hàng: ' + error.message)
    }
  }

  if (loading) {
    return (
      <Layout user={user}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout user={user} title="Giao Diện Người Dùng">
      {/* Tabs */}
      <div className="mb-6 flex space-x-4">
        <Button
          onClick={() => setActiveTab('browse')}
          variant={activeTab === 'browse' ? 'primary' : 'outline'}
        >
          📚 Duyệt sách ({books.length})
        </Button>
        <Button
          onClick={() => setActiveTab('cart')}
          variant={activeTab === 'cart' ? 'primary' : 'outline'}
        >
          🛒 Giỏ hàng ({cart.length})
        </Button>
        <Button
          onClick={() => setActiveTab('history')}
          variant={activeTab === 'history' ? 'primary' : 'outline'}
        >
          📋 Lịch sử mượn
        </Button>
        <Button
          onClick={() => setActiveTab('statistics')}
          variant={activeTab === 'statistics' ? 'primary' : 'outline'}
        >
          📊 Thống kê
        </Button>
      </div>

      {/* Browse Books */}
      {activeTab === 'browse' && (
        <div>
          <Card title="Danh Sách Sách Có Sẵn">
            {books.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Không có sách nào</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {books.map(book => (
                  <div key={book.rfid} className="border rounded-lg p-4 hover:shadow-lg transition-all hover:border-primary">
                    <h3 className="font-bold text-xl mb-3 text-gray-800">{book.name}</h3>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Số lượng còn lại:</span>
                        <span className={`text-lg font-bold ${book.book_lefts > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {book.book_lefts} cuốn
                        </span>
                      </div>
                      {book.book_lefts > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min((book.book_lefts / 10) * 100, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => addToCart(book)}
                      disabled={book.book_lefts === 0}
                      className="w-full"
                      variant={book.book_lefts === 0 ? 'outline' : 'secondary'}
                    >
                      {book.book_lefts === 0 ? '❌ Hết sách' : '➕ Thêm vào giỏ'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Cart */}
      {activeTab === 'cart' && (
        <div>
          <Card title="🛒 Giỏ Hàng">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Giỏ hàng trống</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((book, idx) => (
                    <div key={book.rfid} className="flex justify-between items-center border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{book.name}</p>
                          <p className="text-sm text-gray-600">Còn lại: {book.book_lefts} cuốn</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeFromCart(book.rfid)}
                        variant="danger"
                      >
                        🗑️ Xóa
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="bg-primary-50 p-4 rounded-lg mb-4">
                  <p className="text-lg font-bold text-primary">
                    Tổng cộng: {cart.length} sách
                  </p>
                </div>
                <Button
                  onClick={handleCreateOrder}
                  className="w-full text-lg py-3"
                >
                  ✓ Tạo đơn mượn sách
                </Button>
              </>
            )}
          </Card>
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div>
          <Card title="📋 Lịch Sử Mượn Sách">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có lịch sử mượn sách</p>
            ) : (
              <div className="space-y-4">
                {history.map(order => (
                  <div key={order.order_id} className="border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-bold text-xl text-primary">Đơn hàng #{order.order_id}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          🕒 {new Date(order.ts_created).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          order.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'pending'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'completed' 
                            ? '✓ Đã hoàn thành' 
                            : order.status === 'pending' 
                            ? '📖 Đang mượn' 
                            : '⏳ Đang xử lý'}
                        </span>
                        {order.status === 'ordering' && (
                          <button
                            onClick={() => handleDeleteOrder(order.order_id, order.status)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                            title="Xóa đơn hàng"
                          >
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold mb-2 text-gray-700">Danh sách sách:</p>
                      <div className="space-y-2">
                        {order.order_detail.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">�</span>
                              <span className="font-medium">{detail.book.name}</span>
                            </div>
                            <span className={`text-sm font-medium ${detail.return_timestamp ? 'text-green-600' : 'text-orange-600'}`}>
                              {detail.return_timestamp 
                                ? `✓ Đã trả (${new Date(detail.return_timestamp).toLocaleDateString('vi-VN')})` 
                                : '⏳ Chưa trả'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Statistics */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <Card title="Thống Kê Mượn Sách Của Bạn">
            {/* Toggle Month/Week */}
            <div className="mb-6 flex space-x-3">
              <Button
                onClick={() => handlePeriodChange('month')}
                variant={statsPeriod === 'month' ? 'primary' : 'outline'}
                className="flex-1"
              >
                📅 Theo tháng (12 tháng)
              </Button>
              <Button
                onClick={() => handlePeriodChange('week')}
                variant={statsPeriod === 'week' ? 'primary' : 'outline'}
                className="flex-1"
              >
                📆 Theo tuần (Tháng này)
              </Button>
            </div>

            {!statistics ? (
              <p className="text-gray-500 text-center py-8">Đang tải thống kê...</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Biểu đồ cột - Mượn theo tháng/tuần */}
                <div className="bg-white p-4 rounded-lg border">
                  {statistics.borrowingData && statistics.borrowingData.length > 0 ? (
                    <MonthlyBorrowingChart data={statistics.borrowingData} period={statsPeriod} />
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      Chưa có dữ liệu mượn sách
                    </div>
                  )}
                </div>

                {/* Biểu đồ tròn - Tình trạng trả */}
                <div className="bg-white p-4 rounded-lg border">
                  {statistics.returnStatus && statistics.returnStatus.length > 0 ? (
                    <ReturnStatusChart data={statistics.returnStatus} />
                  ) : (
                    <div className="h-80 flex items-center justify-center text-gray-500">
                      Chưa có dữ liệu trả sách
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </Layout>
  )
}
