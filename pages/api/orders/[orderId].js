import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// GET: Lấy thông tin đơn hàng
async function handleGet(req, res) {
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

// DELETE: Xóa đơn hàng và cộng lại book_lefts
async function handleDelete(req, res) {
  try {
    const { orderId } = req.query

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID là bắt buộc' })
    }

    // Lấy thông tin order và các sách trong đơn
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_detail(
          rfid,
          book(rfid, book_lefts)
        )
      `)
      .eq('order_id', orderId)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
    }

    // Chỉ cho phép xóa đơn ở trạng thái 'ordering' (chưa lấy sách)
    if (order.status !== 'ordering') {
      return res.status(400).json({ error: 'Chỉ có thể xóa đơn hàng đang xử lý (chưa lấy sách)' })
    }

    // ✅ CỘNG LẠI book_lefts cho các sách
    for (const detail of order.order_detail) {
      const { rfid, book } = detail
      if (book && book.book_lefts !== null) {
        const { error: updateError } = await supabase
          .from('book')
          .update({ book_lefts: book.book_lefts + 1 })
          .eq('rfid', rfid)

        if (updateError) {
          console.error(`Lỗi cập nhật book_lefts cho RFID ${rfid}:`, updateError)
          throw updateError
        }
      }
    }

    // Xóa order_detail trước (foreign key constraint)
    const { error: deleteDetailsError } = await supabase
      .from('order_detail')
      .delete()
      .eq('order_id', orderId)

    if (deleteDetailsError) throw deleteDetailsError

    // Xóa order
    const { error: deleteOrderError } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', orderId)

    if (deleteOrderError) throw deleteOrderError

    console.log(`✅ Đã xóa đơn hàng #${orderId} và hoàn trả book_lefts`)

    return res.status(200).json({ 
      message: 'Đã xóa đơn hàng thành công',
      order_id: orderId 
    })
  } catch (error) {
    console.error('Delete order error:', error)
    return res.status(500).json({ error: 'Không thể xóa đơn hàng' })
  }
}
