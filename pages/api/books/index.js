import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'POST') {
    return handleCreate(req, res)
  } else if (req.method === 'PUT') {
    return handleUpdate(req, res)
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res)
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
}

// GET: Lấy danh sách tất cả sách
async function handleGet(req, res) {
  try {
    const { available } = req.query

    let query = supabase
      .from('book')
      .select('*')
      .order('name')

    // Nếu chỉ lấy sách còn hàng
    if (available === 'true') {
      query = query.gt('book_lefts', 0)
    }

    const { data: books, error } = await query

    if (error) throw error

    return res.status(200).json({ books })
  } catch (error) {
    console.error('Get books error:', error)
    return res.status(500).json({ error: 'Không thể lấy danh sách sách' })
  }
}

// POST: Tạo sách mới
async function handleCreate(req, res) {
  try {
    const { rfid, name, book_lefts, position_x, position_y, position_z } = req.body

    if (!rfid || !name || book_lefts === undefined) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (rfid, name, book_lefts)' })
    }

    if (book_lefts < 0) {
      return res.status(400).json({ error: 'Số lượng sách không thể âm' })
    }

    // Check if RFID exists
    const { data: existing } = await supabase
      .from('book')
      .select('rfid')
      .eq('rfid', rfid)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'RFID đã tồn tại' })
    }

    // Create book
    const { data: book, error } = await supabase
      .from('book')
      .insert([{
        rfid,
        name,
        book_lefts: parseInt(book_lefts),
        position_x: position_x ? parseFloat(position_x) : null,
        position_y: position_y ? parseFloat(position_y) : null,
        position_z: position_z ? parseFloat(position_z) : null
      }])
      .select()
      .single()

    if (error) throw error

    return res.status(201).json({ book })
  } catch (error) {
    console.error('Create book error:', error)
    return res.status(500).json({ error: 'Không thể tạo sách' })
  }
}

// PUT: Cập nhật thông tin sách
async function handleUpdate(req, res) {
  try {
    const { rfid, name, book_lefts, position_x, position_y, position_z } = req.body

    if (!rfid) {
      return res.status(400).json({ error: 'RFID là bắt buộc' })
    }

    const updates = {}
    if (name !== undefined) updates.name = name
    if (book_lefts !== undefined) {
      if (book_lefts < 0) {
        return res.status(400).json({ error: 'Số lượng sách không thể âm' })
      }
      updates.book_lefts = parseInt(book_lefts)
    }
    if (position_x !== undefined) updates.position_x = parseFloat(position_x)
    if (position_y !== undefined) updates.position_y = parseFloat(position_y)
    if (position_z !== undefined) updates.position_z = parseFloat(position_z)

    const { data: book, error } = await supabase
      .from('book')
      .update(updates)
      .eq('rfid', rfid)
      .select()
      .single()

    if (error) throw error

    return res.status(200).json({ book })
  } catch (error) {
    console.error('Update book error:', error)
    return res.status(500).json({ error: 'Không thể cập nhật sách' })
  }
}

// DELETE: Xóa sách
async function handleDelete(req, res) {
  try {
    const { rfid } = req.body

    if (!rfid) {
      return res.status(400).json({ error: 'RFID là bắt buộc' })
    }

    // Check if book is in any pending order
    const { data: orderDetails } = await supabase
      .from('order_detail')
      .select(`
        order_id,
        orders!inner(status)
      `)
      .eq('rfid', rfid)

    const hasPendingOrder = orderDetails?.some(
      detail => detail.orders.status === 'pending'
    )

    if (hasPendingOrder) {
      return res.status(400).json({ error: 'Không thể xóa sách đang được mượn' })
    }

    const { error } = await supabase
      .from('book')
      .delete()
      .eq('rfid', rfid)

    if (error) throw error

    return res.status(200).json({ message: 'Xóa sách thành công' })
  } catch (error) {
    console.error('Delete book error:', error)
    return res.status(500).json({ error: 'Không thể xóa sách' })
  }
}
