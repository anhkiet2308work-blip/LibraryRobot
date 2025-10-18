import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' })
    }

    // Query user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' })
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user
    return res.status(200).json({ user: userWithoutPassword })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Lỗi server' })
  }
}
