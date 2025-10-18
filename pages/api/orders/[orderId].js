import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.query

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID là bắt buộc' })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(user_id, email, role),
        order_detail(
          rfid,
          return_timestamp,
          book(rfid, name, book_lefts, position_x, position_y, position_z)
        )
      `)
      .eq('order_id', orderId)
      .single()

    if (error || !order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
    }

    return res.status(200).json({ order })
  } catch (error) {
    console.error('Get order error:', error)
    return res.status(500).json({ error: 'Không thể lấy thông tin đơn hàng' })
  }
}
