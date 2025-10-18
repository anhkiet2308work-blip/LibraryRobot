import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Modal from '../components/Modal'
import {
  getCurrentUser,
  getUsers,
  createUser,
  deleteUser,
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  getReport,
  getAdminStatistics
} from '../lib/api'
import toast from 'react-hot-toast'
import MonthlyBorrowingChart from '../components/MonthlyBorrowingChart'
import ReturnStatusChart from '../components/ReturnStatusChart'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('users') // users, books, reports, statistics
  const [loading, setLoading] = useState(true)

  // Users
  const [users, setUsers] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' })

  // Books
  const [books, setBooks] = useState([])
  const [showBookModal, setShowBookModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [bookForm, setBookForm] = useState({
    rfid: '',
    name: '',
    book_lefts: 0,
    position_x: 0,
    position_y: 0,
    position_z: 0
  })

  // Reports
  const [reports, setReports] = useState([])

  // Statistics
  const [statistics, setStatistics] = useState(null)
  const [statsPeriod, setStatsPeriod] = useState('month') // month hoặc week

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/')
        return
      }
      setUser(currentUser)
      loadData()
    }
    checkAuth()
  }, [])

  const loadData = async (period = 'month') => {
    try {
      const [usersData, booksData, reportsData, statsData] = await Promise.all([
        getUsers(),
        getBooks(),
        getReport(),
        getAdminStatistics(period)
      ])
      setUsers(usersData)
      setBooks(booksData)
      setReports(reportsData)
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
      const statsData = await getAdminStatistics(newPeriod)
      setStatistics(statsData)
    } catch (error) {
      toast.error('Không thể tải thống kê')
    }
  }

  // User functions
  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await createUser(newUser.email, newUser.password, newUser.role)
      toast.success('Tạo người dùng thành công')
      setShowUserModal(false)
      setNewUser({ email: '', password: '', role: 'user' })
      const usersData = await getUsers()
      setUsers(usersData)
    } catch (error) {
      toast.error('Không thể tạo người dùng: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return
    try {
      await deleteUser(userId)
      toast.success('Đã xóa người dùng')
      const usersData = await getUsers()
      setUsers(usersData)
    } catch (error) {
      toast.error('Không thể xóa người dùng: ' + error.message)
    }
  }

  // Book functions
  const handleOpenBookModal = (book = null) => {
    if (book) {
      setEditingBook(book)
      setBookForm(book)
    } else {
      setEditingBook(null)
      setBookForm({
        rfid: '',
        name: '',
        book_lefts: 0,
        position_x: 0,
        position_y: 0,
        position_z: 0
      })
    }
    setShowBookModal(true)
  }

  const handleSaveBook = async (e) => {
    e.preventDefault()
    try {
      if (editingBook) {
        await updateBook(bookForm.rfid, bookForm)
        toast.success('Cập nhật sách thành công')
      } else {
        await createBook(bookForm)
        toast.success('Thêm sách thành công')
      }
      setShowBookModal(false)
      const booksData = await getBooks()
      setBooks(booksData)
    } catch (error) {
      toast.error('Không thể lưu sách: ' + error.message)
    }
  }

  const handleDeleteBook = async (rfid) => {
    if (!confirm('Bạn có chắc muốn xóa sách này?')) return
    try {
      await deleteBook(rfid)
      toast.success('Đã xóa sách')
      const booksData = await getBooks()
      setBooks(booksData)
    } catch (error) {
      toast.error('Không thể xóa sách: ' + error.message)
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
    <Layout user={user} title="Giao Diện Quản Trị">
      {/* Tabs */}
      <div className="mb-6 flex space-x-4">
        <Button
          onClick={() => setActiveTab('users')}
          variant={activeTab === 'users' ? 'primary' : 'outline'}
        >
          👥 Quản lý người dùng
        </Button>
        <Button
          onClick={() => setActiveTab('books')}
          variant={activeTab === 'books' ? 'primary' : 'outline'}
        >
          📚 Quản lý sách
        </Button>
        <Button
          onClick={() => setActiveTab('reports')}
          variant={activeTab === 'reports' ? 'primary' : 'outline'}
        >
          📊 Báo cáo
        </Button>
        <Button
          onClick={() => setActiveTab('statistics')}
          variant={activeTab === 'statistics' ? 'primary' : 'outline'}
        >
          📈 Thống kê
        </Button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card title="Quản Lý Người Dùng">
          <div className="mb-4">
            <Button onClick={() => setShowUserModal(true)}>
              ➕ Thêm người dùng mới
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(u => (
                  <tr key={u.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {u.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        onClick={() => handleDeleteUser(u.user_id)}
                        variant="danger"
                        disabled={u.user_id === user.user_id}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Books Tab */}
      {activeTab === 'books' && (
        <Card title="Quản Lý Sách">
          <div className="mb-4">
            <Button onClick={() => handleOpenBookModal()}>
              ➕ Thêm sách mới
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RFID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sách</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn lại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vị trí (X,Y,Z)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {books.map(book => (
                  <tr key={book.rfid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{book.rfid}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{book.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-bold ${book.book_lefts === 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {book.book_lefts}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ({book.position_x}, {book.position_y}, {book.position_z})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button onClick={() => handleOpenBookModal(book)} variant="outline">
                        Sửa
                      </Button>
                      <Button onClick={() => handleDeleteBook(book.rfid)} variant="danger">
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card title="Báo Cáo Hệ Thống">
          <div className="space-y-4">
            {reports.map(order => (
              <div key={order.order_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">Đơn hàng #{order.order_id}</p>
                    <p className="text-sm text-gray-600">
                      Người dùng: {order.users.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      Thời gian: {new Date(order.ts_created).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'completed' ? 'Hoàn thành' : 'Đang mượn'}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.order_detail.map((detail, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span>📖 {detail.book.name}</span>
                      <span className={detail.return_timestamp ? 'text-green-600' : 'text-yellow-600'}>
                        {detail.return_timestamp ? '✓ Đã trả' : '⏳ Chưa trả'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title="Thêm Người Dùng Mới">
        <form onSubmit={handleCreateUser}>
          <Input
            label="Email"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <Input
            label="Mật khẩu"
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Vai trò</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="user">Người dùng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">Tạo</Button>
            <Button type="button" variant="outline" onClick={() => setShowUserModal(false)} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Book Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title={editingBook ? 'Sửa Sách' : 'Thêm Sách Mới'}>
        <form onSubmit={handleSaveBook}>
          <Input
            label="RFID"
            value={bookForm.rfid}
            onChange={(e) => setBookForm({ ...bookForm, rfid: e.target.value })}
            disabled={!!editingBook}
            required
          />
          <Input
            label="Tên sách"
            value={bookForm.name}
            onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })}
            required
          />
          <Input
            label="Số lượng còn lại"
            type="number"
            value={bookForm.book_lefts}
            onChange={(e) => setBookForm({ ...bookForm, book_lefts: parseInt(e.target.value) })}
            min="0"
            required
          />
          <Input
            label="Vị trí X"
            type="number"
            step="0.01"
            value={bookForm.position_x}
            onChange={(e) => setBookForm({ ...bookForm, position_x: parseFloat(e.target.value) })}
          />
          <Input
            label="Vị trí Y"
            type="number"
            step="0.01"
            value={bookForm.position_y}
            onChange={(e) => setBookForm({ ...bookForm, position_y: parseFloat(e.target.value) })}
          />
          <Input
            label="Vị trí Z"
            type="number"
            step="0.01"
            value={bookForm.position_z}
            onChange={(e) => setBookForm({ ...bookForm, position_z: parseFloat(e.target.value) })}
          />
          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">
              {editingBook ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowBookModal(false)} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Tổng quan */}
          {statistics && statistics.overview && statistics.overview[0] && (
            <Card title="Tổng Quan Hệ Thống">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {statistics.overview[0].total_users}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Người dùng</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {statistics.overview[0].total_books}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Sách</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {statistics.overview[0].total_orders}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Tổng đơn mượn</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {statistics.overview[0].active_orders}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Đơn đang mượn</div>
                </div>
              </div>
            </Card>
          )}

          {/* Biểu đồ */}
          <Card title="Thống Kê Chi Tiết">
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
