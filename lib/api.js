// Auth functions
export async function signIn(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Đăng nhập thất bại')
  }

  return data.user
}

export async function getCurrentUser() {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
  }
}

// User functions
export async function createUser(email, password, role = 'user') {
  const response = await fetch('/api/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể tạo người dùng')
  }

  return data.user
}

export async function getUsers() {
  const response = await fetch('/api/users')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể lấy danh sách người dùng')
  }

  return data.users
}

export async function deleteUser(userId) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE'
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể xóa người dùng')
  }

  return data
}

// Book functions
export async function getBooks() {
  const response = await fetch('/api/books')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể lấy danh sách sách')
  }

  return data.books
}

export async function getAvailableBooks() {
  const response = await fetch('/api/books?available=true')
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể lấy danh sách sách')
  }

  return data.books
}

export async function createBook(book) {
  const response = await fetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể tạo sách')
  }

  return data.book
}

export async function updateBook(rfid, updates) {
  const response = await fetch('/api/books', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid, ...updates })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể cập nhật sách')
  }

  return data.book
}

export async function deleteBook(rfid) {
  const response = await fetch('/api/books', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể xóa sách')
  }

  return data
}

// Order functions
export async function createOrder(userId, bookRfids) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, bookRfids })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể tạo đơn hàng')
  }

  return data.order
}

export async function getOrders(userId = null) {
  const url = userId ? `/api/orders?userId=${userId}` : '/api/orders'
  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể lấy danh sách đơn hàng')
  }

  return data.orders
}

export async function getOrderById(orderId) {
  const response = await fetch(`/api/orders/${orderId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể lấy thông tin đơn hàng')
  }

  return data.order
}

export async function borrowBooks(orderId) {
  const response = await fetch('/api/robot/borrow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể mượn sách')
  }

  return data
}

export async function returnBooks(orderId, rfids) {
  const response = await fetch('/api/robot/return', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, rfids })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể trả sách')
  }

  return data
}

// Order History
export async function getBorrowHistory(userId) {
  return getOrders(userId)
}

// Report
export async function getReport() {
  return getOrders()
}

// Statistics
export async function getUserStatistics(userId, period = 'month') {
  const response = await fetch(`/api/statistics/user/${userId}?period=${period}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể tải thống kê')
  }

  return data
}

export async function getAdminStatistics(period = 'month') {
  const response = await fetch(`/api/statistics/admin?period=${period}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể tải thống kê')
  }

  return data
}

// Delete Order - Xóa đơn hàng và hoàn trả book_lefts
export async function deleteOrder(orderId) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'DELETE'
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Không thể xóa đơn hàng')
  }

  return data
}
