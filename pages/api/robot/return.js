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

    // Normalize function
    const normalize = (val) => String(val).trim()
    
    // Xử lý từng RFID
    for (const rfid of rfids) {
      const cleanRfid = rfid.trim()
      
      // Kiểm tra RFID có trong order không (normalize cả 2 bên)
      const orderDetail = order.order_detail.find(d => 
        normalize(d.rfid) === normalize(cleanRfid)
      )
      
      if (!orderDetail) {
        console.log('❌ RFID không tìm thấy:', cleanRfid)
        console.log('📚 RFIDs trong order:', order.order_detail.map(d => ({
          rfid: d.rfid,
          normalized: normalize(d.rfid),
          match: normalize(d.rfid) === normalize(cleanRfid)
        })))
        return res.status(400).json({ 
          error: `RFID ${cleanRfid} không thuộc đơn hàng này` 
        })
      }

      // Kiểm tra đã trả chưa
      if (orderDetail.return_timestamp) {
        return res.status(400).json({ 
          error: `Sách "${orderDetail.book.name}" đã được trả trước đó` 
        })
      }

      // Dùng RFID thực từ database (orderDetail.rfid) để đảm bảo khớp
      const dbRfid = orderDetail.rfid
      
      console.log('✅ Trả sách:', {
        inputRfid: cleanRfid,
        dbRfid: dbRfid,
        bookName: orderDetail.book.name
      })

      // Cập nhật return_timestamp (dùng RFID từ database)
      const { error: updateDetailError } = await supabase
        .from('order_detail')
        .update({ return_timestamp: now })
        .eq('order_id', orderId)
        .eq('rfid', dbRfid)

      if (updateDetailError) throw updateDetailError

      // Tăng book_lefts (dùng RFID từ database)
      const { data: book } = await supabase
        .from('book')
        .select('book_lefts')
        .eq('rfid', dbRfid)
        .single()

      if (book) {
        const { error: updateBookError } = await supabase
          .from('book')
          .update({ book_lefts: book.book_lefts + 1 })
          .eq('rfid', dbRfid)

        if (updateBookError) throw updateBookError
      }

      returnedBooks.push({
        rfid: dbRfid,
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
