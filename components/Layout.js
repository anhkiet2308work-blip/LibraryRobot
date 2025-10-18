import { useRouter } from 'next/router'
import { logout } from '../lib/api'
import Button from './Button'

export default function Layout({ children, user, title }) {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {title || 'Hệ Thống Quản Lý Thư Viện Robot'}
              </h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Xin chào, <span className="font-medium">{user.email}</span>
                  {' '}({user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'})
                </p>
              )}
            </div>
            {user && (
              <Button onClick={handleLogout} variant="outline">
                Đăng xuất
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
