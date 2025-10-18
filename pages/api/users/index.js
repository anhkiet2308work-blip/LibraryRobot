import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return res.status(500).json({ error: 'Không thể lấy danh sách người dùng' })
  }
}
