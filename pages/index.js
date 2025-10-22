import { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from '../lib/api'
import Button from '../components/Button'
import Input from '../components/Input'
import Card from '../components/Card'
import toast from 'react-hot-toast'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const user = await signIn(email, password)
      localStorage.setItem('user', JSON.stringify(user))
      
      toast.success('Đăng nhập thành công!')
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/user')
      }
    } catch (error) {
      toast.error(error.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            📚 Thư Viện Robot
          </h1>
          <p className="text-blue-100">Hệ thống quản lý thư viện tự động</p>
        </div>

        {/* Login Card */}
        <Card>
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Đăng Nhập
            </h2>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </Card>

        {/* Info */}
        <div className="text-center text-white text-sm">
          <p>Hệ thống quản lý thư viện tự động với Robot</p>
        </div>
      </div>
    </div>
  )
}
