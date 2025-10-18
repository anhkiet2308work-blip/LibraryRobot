# 🏗️ Kiến Trúc Hệ Thống

## Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   User UI    │  │  Admin UI    │  │  Robot UI    │         │
│  │  (React.js)  │  │  (React.js)  │  │  (React.js)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    HTTP Requests (JSON)
                             │
┌─────────────────────────────┼─────────────────────────────────────┐
│                    API LAYER (Next.js)                            │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────┐         │
│  │              API Routes Handler                      │         │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │         │
│  │  │   /auth    │  │   /users   │  │   /books   │    │         │
│  │  └────────────┘  └────────────┘  └────────────┘    │         │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │         │
│  │  │  /orders   │  │   /robot   │  │  /reports  │    │         │
│  │  └────────────┘  └────────────┘  └────────────┘    │         │
│  └───────────────────────┬──────────────────────────────┘         │
│                          │                                        │
│  ┌───────────────────────▼──────────────────────────┐            │
│  │         Business Logic Layer                     │            │
│  │  - Validation                                    │            │
│  │  - Error Handling                                │            │
│  │  - Transaction Management                        │            │
│  │  - Data Transformation                           │            │
│  └───────────────────────┬──────────────────────────┘            │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    Supabase Client
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   DATABASE LAYER                                │
│                   (PostgreSQL - Supabase)                       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  users   │  │   book   │  │  orders  │  │order_    │      │
│  │          │  │          │  │          │  │detail    │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐      │
│  │           Database Triggers & Functions             │      │
│  │  - Auto-update order status on return               │      │
│  │  - Constraints validation (book_lefts >= 0)         │      │
│  └─────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: User Mượn Sách

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Chọn sách, thêm vào giỏ
     ▼
┌─────────────┐
│  User UI    │
└─────┬───────┘
      │ 2. Tạo đơn hàng
      │ POST /api/orders
      ▼
┌──────────────────┐
│  API: /orders    │──────┐
└──────────────────┘      │ 3. Validate: 
                          │    - Sách tồn tại?
                          │    - Còn hàng?
                          ▼
                    ┌─────────────┐
                    │  Database   │
                    │  INSERT     │
                    │  orders +   │
                    │  order_     │
                    │  detail     │
                    └─────┬───────┘
                          │
      ┌───────────────────┘
      │ 4. Return Order ID
      ▼
┌─────────────┐
│  User UI    │
│  "Order #1" │
└─────┬───────┘
      │ 5. User đến Robot
      ▼
┌─────────────┐
│  Robot UI   │
└─────┬───────┘
      │ 6. Nhập Order ID
      │ GET /api/orders/1
      ▼
┌──────────────────┐
│  API: /orders/1  │
└──────┬───────────┘
       │ 7. Lấy thông tin order
       ▼
┌─────────────┐
│  Database   │
│  SELECT     │
└─────┬───────┘
      │ 8. Return order info
      ▼
┌─────────────┐
│  Robot UI   │
│  Hiển thị   │
│  danh sách  │
│  sách       │
└─────┬───────┘
      │ 9. Quét RFID từng sách
      │    User xác nhận
      │ POST /api/robot/borrow
      ▼
┌──────────────────┐
│  API: /robot/    │──────┐
│       borrow     │      │ 10. Validate:
└──────────────────┘      │     - Order pending?
                          │     - Còn hàng?
                          ▼
                    ┌─────────────┐
                    │  Database   │
                    │  UPDATE     │
                    │  book SET   │
                    │  book_lefts │
                    │  = book_    │
                    │  lefts - 1  │
                    └─────┬───────┘
                          │
      ┌───────────────────┘
      │ 11. Success
      ▼
┌─────────────┐
│  Robot UI   │
│  "Xuất sách"│
└─────────────┘
```

---

## Data Flow: User Trả Sách

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Đến Robot với sách
     ▼
┌─────────────┐
│  Robot UI   │
└─────┬───────┘
      │ 2. Nhập Order ID
      │ GET /api/orders/1
      ▼
┌──────────────────┐
│  API: /orders/1  │
└──────┬───────────┘
       │ 3. Lấy sách chưa trả
       ▼
┌─────────────┐
│  Database   │
│  SELECT     │
│  WHERE      │
│  return_    │
│  timestamp  │
│  IS NULL    │
└─────┬───────┘
      │ 4. Return unreturned books
      ▼
┌─────────────┐
│  Robot UI   │
│  Hiển thị   │
│  sách chưa  │
│  trả        │
└─────┬───────┘
      │ 5. Quét RFID từng sách
      │    User xác nhận trả
      │ POST /api/robot/return
      ▼
┌──────────────────┐
│  API: /robot/    │──────┐
│       return     │      │ 6. Validate:
└──────────────────┘      │    - RFID trong order?
                          │    - Chưa trả?
                          ▼
                    ┌─────────────────┐
                    │  Database       │
                    │  BEGIN TRANS    │
                    │                 │
                    │  1. UPDATE      │
                    │     order_      │
                    │     detail SET  │
                    │     return_     │
                    │     timestamp   │
                    │     = NOW()     │
                    │                 │
                    │  2. UPDATE      │
                    │     book SET    │
                    │     book_lefts  │
                    │     = book_     │
                    │     lefts + 1   │
                    │                 │
                    │  3. TRIGGER:    │
                    │     IF all      │
                    │     returned    │
                    │     THEN        │
                    │       UPDATE    │
                    │       orders    │
                    │       SET       │
                    │       status =  │
                    │       'completed'│
                    │                 │
                    │  COMMIT         │
                    └─────┬───────────┘
                          │
      ┌───────────────────┘
      │ 7. Success + status updated
      ▼
┌─────────────┐
│  Robot UI   │
│  "Nhận sách"│
│  "Đã hoàn   │
│   thành"    │
└─────────────┘
```

---

## Component Architecture

```
pages/
├── index.js (Login)
│   └── Uses: Button, Input, Card
│
├── user.js (User Interface)
│   ├── Layout
│   ├── Card
│   ├── Button
│   └── Tabs:
│       ├── Browse Books
│       ├── Shopping Cart
│       └── Borrow History
│
├── admin.js (Admin Interface)
│   ├── Layout
│   ├── Card
│   ├── Button
│   ├── Modal
│   └── Tabs:
│       ├── User Management
│       ├── Book Management
│       └── Reports
│
└── robot.js (Robot Interface)
    ├── Card
    ├── Button
    ├── Input
    └── Modes:
        ├── Borrow Books
        └── Return Books
```

---

## Security & Validation Layers

```
┌────────────────────────────────────────┐
│         Client-Side Validation         │
│  - Required fields                     │
│  - Format checking                     │
│  - Disabled buttons                    │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│         API Route Validation           │
│  - Request method                      │
│  - Required parameters                 │
│  - Data types                          │
│  - Business rules                      │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│         Database Constraints           │
│  - UNIQUE constraints                  │
│  - CHECK constraints                   │
│  - Foreign key constraints             │
│  - NOT NULL constraints                │
└───────────────┬────────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│         Database Triggers              │
│  - Auto-update order status            │
│  - Maintain data consistency           │
└────────────────────────────────────────┘
```

---

## Tech Stack Details

### Frontend
- **React 18.2**: UI components
- **Next.js 14**: Framework, routing, SSR
- **Tailwind CSS**: Styling
- **React Hot Toast**: Notifications

### Backend
- **Next.js API Routes**: RESTful API
- **Supabase JS Client**: Database operations
- **Node.js**: Runtime

### Database
- **PostgreSQL**: Relational database
- **Supabase**: Hosted PostgreSQL
- **PL/pgSQL**: Stored procedures & triggers

### DevOps
- **npm**: Package manager
- **Git**: Version control
- **Environment variables**: Configuration

---

Kiến trúc này đảm bảo:
✅ Separation of concerns
✅ Scalability
✅ Maintainability
✅ Security
✅ Data consistency
