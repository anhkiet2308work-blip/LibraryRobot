import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, role } = req.body

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' })
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' })
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return res.status(400).json({ error: 'Email đã tồn tại' })
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{ email: email.toLowerCase(), password, role }])
      .select('user_id, email, role, created_at')
      .single()

    if (error) throw error

    return res.status(201).json({ user })
  } catch (error) {
    console.error('Create user error:', error)
    return res.status(500).json({ error: 'Không thể tạo người dùng' })
  }
}
