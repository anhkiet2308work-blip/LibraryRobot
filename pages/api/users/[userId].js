import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID là bắt buộc' })
    }

    // Check if user has pending orders
    const { data: orders } = await supabase
      .from('orders')
      .select('order_id')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (orders && orders.length > 0) {
      return res.status(400).json({ error: 'Không thể xóa người dùng có đơn hàng đang mượn' })
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (error) throw error

    return res.status(200).json({ message: 'Xóa người dùng thành công' })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({ error: 'Không thể xóa người dùng' })
  }
}
