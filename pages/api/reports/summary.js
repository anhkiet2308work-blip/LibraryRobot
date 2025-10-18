import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Thống kê tổng quan
    const { data: users } = await supabase
      .from('users')
      .select('user_id, role')

    const { data: books } = await supabase
      .from('book')
      .select('rfid, book_lefts')

    const { data: orders } = await supabase
      .from('orders')
      .select('order_id, status')

    const { data: orderDetails } = await supabase
      .from('order_detail')
      .select('order_id, rfid, return_timestamp')

    // Tính toán
    const totalUsers = users?.length || 0
    const totalAdmins = users?.filter(u => u.role === 'admin').length || 0
    const totalBooks = books?.length || 0
    const totalBooksInStock = books?.reduce((sum, b) => sum + b.book_lefts, 0) || 0
    const totalOrders = orders?.length || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
    const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
    const totalBooksBorrowed = orderDetails?.filter(d => !d.return_timestamp).length || 0

    return res.status(200).json({
      summary: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          regularUsers: totalUsers - totalAdmins
        },
        books: {
          total: totalBooks,
          inStock: totalBooksInStock,
          borrowed: totalBooksBorrowed
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        }
      }
    })
  } catch (error) {
    console.error('Get report error:', error)
    return res.status(500).json({ error: 'Không thể tạo báo cáo' })
  }
}
