import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID là bắt buộc' })
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 API Borrow Request (MQTT mode)')
    console.log('   Order ID:', orderId)

    // Lấy thông tin order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_detail(rfid, return_timestamp, book(rfid, name, book_lefts))
      `)
      .eq('order_id', orderId)
      .single()

    if (orderError || !order) {
      console.log('❌ Order not found:', orderId)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
    }

    // Kiểm tra order đang ở trạng thái 'ordering' (chưa lấy sách)
    if (order.status !== 'ordering') {
      console.log('❌ Order status invalid:', order.status, '(expected: ordering)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return res.status(400).json({ error: 'Đơn hàng này đã được xử lý hoặc không hợp lệ' })
    }

    // NOTE: MQTT message đã được gửi từ client-side trước khi call API này

    // Kiểm tra các sách chưa được mượn (return_timestamp phải null)
    const booksToLend = order.order_detail.filter(detail => !detail.return_timestamp)

    if (booksToLend.length === 0) {
      console.log('❌ No books to lend')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return res.status(400).json({ error: 'Tất cả sách trong đơn đã được mượn' })
    }

    // CẬP NHẬT STATUS: ordering → pending (Đang mượn)
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('order_id', orderId)

    if (updateError) {
      console.log('❌ Update status error:', updateError)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      throw updateError
    }

    console.log('✅ Order status updated: ordering → pending')
    console.log('✅ Borrow process completed for order:', orderId)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // ⚠️ NOTE: 
    // - MQTT message đã gửi từ client-side đến topic: robot_thu_vien/command
    // - book_lefts đã được trừ khi tạo order
    // - Endpoint này chỉ để chuyển status: ordering → pending

    // Lấy thông tin order sau khi cập nhật
    const { data: updatedOrder } = await supabase
      .from('orders')
      .select(`
        *,
        order_detail(rfid, return_timestamp, book(rfid, name, book_lefts))
      `)
      .eq('order_id', orderId)
      .single()

    return res.status(200).json({ 
      success: true,
      message: `Đã chuyển sang trạng thái "Đang mượn" cho ${booksToLend.length} sách`,
      order: updatedOrder,
      statusChanged: 'ordering → pending'
    })
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Borrow API Error:', error.message)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return res.status(500).json({ error: 'Không thể mượn sách' })
  }
}
