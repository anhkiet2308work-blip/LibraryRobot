import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import { getCurrentUser, getAvailableBooks, createOrder, getBorrowHistory, getUserStatistics } from '../lib/api'
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
                  <div key={book.rfid} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg mb-2">{book.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">RFID: {book.rfid}</p>
                    <p className="text-sm text-gray-600 mb-3">
                      Còn lại: <span className="font-bold text-secondary">{book.book_lefts}</span> cuốn
                    </p>
                    <Button
                      onClick={() => addToCart(book)}
                      disabled={book.book_lefts === 0}
                      className="w-full"
                      variant="secondary"
                    >
                      {book.book_lefts === 0 ? 'Hết sách' : 'Thêm vào giỏ'}
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
          <Card title="Giỏ Hàng">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Giỏ hàng trống</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map(book => (
                    <div key={book.rfid} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{book.name}</p>
                        <p className="text-sm text-gray-600">RFID: {book.rfid}</p>
                      </div>
                      <Button
                        onClick={() => removeFromCart(book.rfid)}
                        variant="danger"
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleCreateOrder}
                  className="w-full"
                >
                  Tạo đơn hàng ({cart.length} sách)
                </Button>
              </>
            )}
          </Card>
        </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
        <div>
          <Card title="Lịch Sử Mượn Sách">
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có lịch sử mượn sách</p>
            ) : (
              <div className="space-y-4">
                {history.map(order => (
                  <div key={order.order_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg">Đơn hàng #{order.order_id}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.ts_created).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status === 'completed' ? 'Đã hoàn thành' : 'Đang mượn'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {order.order_detail.map((detail, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>📖 {detail.book.name}</span>
                          <span className="text-gray-600">
                            {detail.return_timestamp 
                              ? `Đã trả: ${new Date(detail.return_timestamp).toLocaleString('vi-VN')}` 
                              : 'Chưa trả'}
                          </span>
                        </div>
                      ))}
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
