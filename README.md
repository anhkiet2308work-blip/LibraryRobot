# 📚 Hệ Thống Quản Lý Thư Viện Robot

Hệ thống quản lý thư viện tự động với robot hỗ trợ mượn/trả sách, được xây dựng với Next.js, React, và Supabase.

## ✨ Tính năng

### 👤 Giao diện Người dùng (User)
- Đăng nhập vào hệ thống
- Duyệt danh sách sách có sẵn
- Thêm sách vào giỏ hàng
- Tạo đơn hàng mượn sách
- Xem lịch sử mượn trả sách
- **📊 Thống kê cá nhân** (Mới):
  - Biểu đồ cột: Xu hướng mượn sách theo tháng
  - Biểu đồ tròn: Tỷ lệ sách đã trả/chưa trả

### 👨‍💼 Giao diện Quản trị (Admin)
- Quản lý người dùng (thêm, xóa)
- Quản lý sách (thêm, sửa, xóa)
- Cập nhật số lượng và vị trí sách
- Xem báo cáo hệ thống
- **📈 Thống kê toàn hệ thống** (Mới):
  - Tổng quan: Số người dùng, sách, đơn mượn
  - Biểu đồ cột: Xu hướng mượn sách theo tháng (toàn hệ thống)
  - Biểu đồ tròn: Tỷ lệ sách đã trả/chưa trả (toàn hệ thống)

### 🤖 Giao diện Robot
- Mượn sách: Quét RFID và xuất sách cho người dùng
- Trả sách: Quét RFID và nhận sách trả lại
- Tự động cập nhật số lượng sách
- Hiển thị vị trí sách trong kho (X, Y, Z)

## 🚀 Cài đặt

### Yêu cầu
- Node.js 16+ và npm/yarn
- Database PostgreSQL trên Supabase

### Các bước cài đặt

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Cấu hình database:**
   - Truy cập Supabase Dashboard
   - Chạy script SQL trong file `database/setup.sql`
   - Chạy script SQL trong file `database/statistics_functions.sql` (cho tính năng thống kê)
   - File `.env.local` đã được cấu hình sẵn với thông tin kết nối
   - **Chi tiết**: Xem `docs/STATISTICS_SETUP.md`

3. **Chạy ứng dụng:**
```bash
npm run dev
```

4. **Truy cập ứng dụng:**
   - Mở trình duyệt: http://localhost:3000

## 📊 Cơ sở dữ liệu

### Bảng chính:
- **users**: Quản lý người dùng (admin/user)
- **book**: Thông tin sách (RFID, tên, số lượng, vị trí)
- **orders**: Đơn hàng mượn sách
- **order_detail**: Chi tiết sách trong mỗi đơn hàng

### Trigger tự động:
- Tự động cập nhật trạng thái đơn hàng khi tất cả sách được trả

## 🔐 Đăng nhập demo

### Tạo tài khoản admin đầu tiên:
Chạy SQL trong Supabase:
```sql
INSERT INTO users (email, password, role) 
VALUES ('admin@example.com', 'admin123', 'admin');
```

### Tạo tài khoản user demo:
```sql
INSERT INTO users (email, password, role) 
VALUES ('user@example.com', 'user123', 'user');
```

### Thêm sách demo:
```sql
INSERT INTO book (rfid, name, book_lefts, position_x, position_y, position_z) VALUES
('RFID001', 'Lập trình JavaScript', 5, 1.5, 2.0, 3.0),
('RFID002', 'React cho người mới bắt đầu', 3, 1.5, 2.5, 3.0),
('RFID003', 'Next.js Advanced', 4, 2.0, 2.0, 3.5);
```

## 🎯 Quy trình sử dụng

### Mượn sách:
1. User đăng nhập → Duyệt sách → Thêm vào giỏ hàng → Tạo đơn hàng
2. Hệ thống tạo Order ID
3. User đến Robot → Nhập Order ID
4. Robot quét RFID các sách
5. Xác nhận → Hệ thống trừ `book_lefts`

### Trả sách:
1. User đến Robot với sách cần trả
2. Nhập Order ID vào Robot
3. Robot quét RFID các sách trả lại
4. Xác nhận → Hệ thống:
   - Cộng `book_lefts`
   - Cập nhật `return_timestamp`
   - Tự động đổi status thành `completed` nếu đã trả hết

## 📁 Cấu trúc dự án

```
library_robot/
├── components/              # React components
│   ├── Button.js
│   ├── Card.js
│   ├── Input.js
│   ├── Layout.js
│   ├── Modal.js
│   ├── MonthlyBorrowingChart.js  # 📊 Biểu đồ cột
│   └── ReturnStatusChart.js      # 📊 Biểu đồ tròn
├── lib/                    # Utility functions
│   ├── api.js              # API client (frontend)
│   └── supabase.js         # Supabase client
├── pages/                  # Next.js pages
│   ├── api/                # Backend API routes
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── books/          # Book management
│   │   ├── orders/         # Order management
│   │   ├── robot/          # Robot operations
│   │   └── statistics/     # 📊 Statistics endpoints
│   ├── _app.js
│   ├── _document.js
│   ├── index.js            # Login page
│   ├── user.js             # User interface (+ Statistics tab)
│   ├── admin.js            # Admin interface (+ Statistics tab)
│   └── robot.js            # Robot interface
├── database/               # SQL scripts
│   ├── setup.sql           # Main database schema
│   └── statistics_functions.sql  # 📊 Stored procedures
├── docs/                   # Documentation
│   ├── STATISTICS_SETUP.md
│   └── STATISTICS_FEATURE.md
├── styles/
│   └── globals.css
├── .env.local              # Environment variables
├── package.json
└── README.md
```

## 🛠 Công nghệ sử dụng

- **Frontend**: React.js
- **Backend**: Next.js (API Routes) - Xử lý business logic đầy đủ
- **Database**: PostgreSQL (Supabase) - Có triggers tự động
- **Styling**: Tailwind CSS
- **Notifications**: React Hot Toast
- **Charts**: Chart.js + react-chartjs-2 (Biểu đồ thống kê)

## 🔧 Backend API

Hệ thống có backend API hoàn chỉnh xử lý tất cả logic nghiệp vụ:

### API Endpoints:
- **Auth**: `/api/auth/*` - Xác thực
- **Users**: `/api/users/*` - Quản lý người dùng
- **Books**: `/api/books/*` - Quản lý sách
- **Orders**: `/api/orders/*` - Quản lý đơn hàng
- **Robot**: `/api/robot/*` - Xử lý mượn/trả sách
- **Statistics**: `/api/statistics/*` - 📊 Thống kê với biểu đồ

📚 **Chi tiết API**: Xem `API_DOCUMENTATION.md`
🧪 **Test API**: Xem `TEST_API.md`
📊 **Tính năng thống kê**: Xem `docs/STATISTICS_FEATURE.md`

## 📝 Lưu ý

- Đây là phiên bản demo, Robot interface không yêu cầu xác thực
- Mật khẩu được lưu dạng plain text (production cần mã hóa)
- RFID có thể nhập thủ công hoặc quét bằng thiết bị RFID reader

## 🤝 Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Database connection trong `.env.local`
2. Đã chạy script SQL đầy đủ
3. Node modules đã được cài đặt

## 📄 License

MIT License - Tự do sử dụng cho mục đích học tập và thương mại.
