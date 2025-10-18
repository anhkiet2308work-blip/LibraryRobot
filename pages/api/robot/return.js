import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId, rfids } = req.body

    if (!orderId || !rfids || !Array.isArray(rfids) || rfids.length === 0) {
      return res.status(400).json({ error: 'Order ID và danh sách RFID là bắt buộc' })
    }

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
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
    }

    const now = new Date().toISOString()
    const returnedBooks = []

    // Xử lý từng RFID
    for (const rfid of rfids) {
      // Kiểm tra RFID có trong order không
      const orderDetail = order.order_detail.find(d => d.rfid === rfid)
      
      if (!orderDetail) {
        return res.status(400).json({ 
          error: `RFID ${rfid} không thuộc đơn hàng này` 
        })
      }

      // Kiểm tra đã trả chưa
      if (orderDetail.return_timestamp) {
        return res.status(400).json({ 
          error: `Sách "${orderDetail.book.name}" đã được trả trước đó` 
        })
      }

      // Cập nhật return_timestamp
      const { error: updateDetailError } = await supabase
        .from('order_detail')
        .update({ return_timestamp: now })
        .eq('order_id', orderId)
        .eq('rfid', rfid)

      if (updateDetailError) throw updateDetailError

      // Tăng book_lefts
      const { data: book } = await supabase
        .from('book')
        .select('book_lefts')
        .eq('rfid', rfid)
        .single()

      if (book) {
        const { error: updateBookError } = await supabase
          .from('book')
          .update({ book_lefts: book.book_lefts + 1 })
          .eq('rfid', rfid)

        if (updateBookError) throw updateBookError
      }

      returnedBooks.push({
        rfid,
        name: orderDetail.book.name
      })
    }

    // Kiểm tra xem đã trả hết sách chưa
    const { data: remainingBooks } = await supabase
      .from('order_detail')
      .select('rfid')
      .eq('order_id', orderId)
      .is('return_timestamp', null)

    // Trigger sẽ tự động cập nhật status thành 'completed' nếu đã trả hết

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
      message: `Đã trả ${returnedBooks.length} sách thành công`,
      returnedBooks,
      allReturned: remainingBooks.length === 0,
      order: updatedOrder
    })
  } catch (error) {
    console.error('Return books error:', error)
    return res.status(500).json({ error: 'Không thể trả sách' })
  }
}
