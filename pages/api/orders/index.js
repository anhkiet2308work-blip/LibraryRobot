import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handleCreate(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// GET: Lấy danh sách đơn hàng
async function handleGet(req, res) {
  try {
    const { userId } = req.query

    let query = supabase
      .from('orders')
      .select(`
        *,
        users(user_id, email, role),
        order_detail(
          rfid,
          return_timestamp,
          book(rfid, name, position_x, position_y, position_z)
        )
      `)
      .order('ts_created', { ascending: false })

    // Lọc theo user nếu có
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: orders, error } = await query

    if (error) throw error

    return res.status(200).json({ orders })
  } catch (error) {
    console.error('Get orders error:', error)
    return res.status(500).json({ error: 'Không thể lấy danh sách đơn hàng' })
  }
}

// POST: Tạo đơn hàng mới
async function handleCreate(req, res) {
  try {
    const { userId, bookRfids } = req.body

    if (!userId || !bookRfids || !Array.isArray(bookRfids) || bookRfids.length === 0) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
    }

    // Validate tất cả sách có tồn tại và còn hàng
    for (const rfid of bookRfids) {
      const { data: book, error } = await supabase
        .from('book')
        .select('rfid, name, book_lefts')
        .eq('rfid', rfid)
        .single()

      if (error || !book) {
        return res.status(400).json({ error: `Sách với RFID ${rfid} không tồn tại` })
      }

      if (book.book_lefts <= 0) {
        return res.status(400).json({ error: `Sách "${book.name}" đã hết` })
      }
    }

    // Tạo order - để database tự dùng default status = 'ordering'
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userId
        // Không set status - để database dùng DEFAULT 'ordering'
      }])
      .select()
      .single()

    if (orderError) {
      console.error('❌ Create order error:', orderError)
      throw orderError
    }
    
    console.log('✅ Created order (order_id:', order.order_id, 'status:', order.status, ')')

    // Tạo order_detail cho từng sách
    const orderDetails = bookRfids.map(rfid => ({
      order_id: order.order_id,
      rfid: rfid,
      return_timestamp: null
    }))

    const { error: detailsError } = await supabase
      .from('order_detail')
      .insert(orderDetails)

    if (detailsError) {
      // Rollback: xóa order nếu không tạo được detail
      await supabase
        .from('orders')
        .delete()
        .eq('order_id', order.order_id)
      throw detailsError
    }

    // ✅ TRỪ book_lefts NGAY KHI TẠO ĐơN HÀNG
    for (const rfid of bookRfids) {
      const { data: book } = await supabase
        .from('book')
        .select('book_lefts')
        .eq('rfid', rfid)
        .single()

      if (book && book.book_lefts > 0) {
        const { error: updateError } = await supabase
          .from('book')
          .update({ book_lefts: book.book_lefts - 1 })
          .eq('rfid', rfid)

        if (updateError) {
          // Rollback nếu có lỗi
          await supabase
            .from('orders')
            .delete()
            .eq('order_id', order.order_id)
          throw updateError
        }
      }
    }

    // Lấy thông tin đầy đủ của order vừa tạo
    const { data: fullOrder } = await supabase
      .from('orders')
      .select(`
        *,
        users(user_id, email, role),
        order_detail(
          rfid,
          return_timestamp,
          book(rfid, name)
        )
      `)
      .eq('order_id', order.order_id)
      .single()

    return res.status(201).json({ order: fullOrder })
  } catch (error) {
    console.error('Create order error:', error)
    return res.status(500).json({ error: 'Không thể tạo đơn hàng' })
  }
}
