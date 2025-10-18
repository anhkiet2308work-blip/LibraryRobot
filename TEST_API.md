# 🧪 Test API Scripts

## Prerequisites
Đảm bảo:
1. Server đang chạy: `npm run dev`
2. Database đã setup với script `database/setup.sql`
3. Có PowerShell hoặc curl

---

## PowerShell Scripts

### 1. Test Login (Admin)
```powershell
$body = @{
    email = "admin@library.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### 2. Test Login (User)
```powershell
$body = @{
    email = "user1@library.com"
    password = "user123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### 3. Get All Books
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
```

### 4. Get Available Books Only
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/books?available=true" -Method Get
```

### 5. Create New Book
```powershell
$body = @{
    rfid = "RFID_TEST"
    name = "Test Book"
    book_lefts = 5
    position_x = 1.5
    position_y = 2.0
    position_z = 3.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Post -Body $body -ContentType "application/json"
```

### 6. Create Order
```powershell
# Thay userId = 2 (user1@library.com từ setup.sql)
$body = @{
    userId = 2
    bookRfids = @("RFID001", "RFID002")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Post -Body $body -ContentType "application/json"
```

### 7. Get Order Detail
```powershell
# Thay orderId bằng ID vừa tạo
$orderId = 1
Invoke-RestMethod -Uri "http://localhost:3000/api/orders/$orderId" -Method Get
```

### 8. Robot Borrow Books
```powershell
$body = @{
    orderId = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/robot/borrow" -Method Post -Body $body -ContentType "application/json"
```

### 9. Robot Return Books
```powershell
$body = @{
    orderId = 1
    rfids = @("RFID001", "RFID002")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/robot/return" -Method Post -Body $body -ContentType "application/json"
```

### 10. Get Report Summary
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/reports/summary" -Method Get
```

---

## Full Test Flow (Copy-Paste)

```powershell
# Test đầy đủ quy trình mượn trả sách

Write-Host "=== 1. Login User ===" -ForegroundColor Green
$loginBody = @{
    email = "user1@library.com"
    password = "user123"
} | ConvertTo-Json
$user = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "User ID: $($user.user.user_id)"

Write-Host "`n=== 2. Get Available Books ===" -ForegroundColor Green
$books = Invoke-RestMethod -Uri "http://localhost:3000/api/books?available=true" -Method Get
Write-Host "Available books: $($books.books.Count)"
$books.books | Select-Object rfid, name, book_lefts | Format-Table

Write-Host "`n=== 3. Create Order ===" -ForegroundColor Green
$orderBody = @{
    userId = $user.user.user_id
    bookRfids = @("RFID001", "RFID002")
} | ConvertTo-Json
$newOrder = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
Write-Host "Order ID: $($newOrder.order.order_id)"

Write-Host "`n=== 4. Check Book Stock (Before Borrow) ===" -ForegroundColor Green
$booksBefore = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$booksBefore.books | Where-Object { $_.rfid -in @("RFID001", "RFID002") } | Select-Object rfid, name, book_lefts | Format-Table

Write-Host "`n=== 5. Robot Borrow (Trừ book_lefts) ===" -ForegroundColor Green
$borrowBody = @{
    orderId = $newOrder.order.order_id
} | ConvertTo-Json
$borrowResult = Invoke-RestMethod -Uri "http://localhost:3000/api/robot/borrow" -Method Post -Body $borrowBody -ContentType "application/json"
Write-Host $borrowResult.message

Write-Host "`n=== 6. Check Book Stock (After Borrow) ===" -ForegroundColor Green
$booksAfterBorrow = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$booksAfterBorrow.books | Where-Object { $_.rfid -in @("RFID001", "RFID002") } | Select-Object rfid, name, book_lefts | Format-Table

Write-Host "`n=== 7. Robot Return (Cộng book_lefts) ===" -ForegroundColor Green
$returnBody = @{
    orderId = $newOrder.order.order_id
    rfids = @("RFID001", "RFID002")
} | ConvertTo-Json
$returnResult = Invoke-RestMethod -Uri "http://localhost:3000/api/robot/return" -Method Post -Body $returnBody -ContentType "application/json"
Write-Host $returnResult.message
Write-Host "All returned: $($returnResult.allReturned)"

Write-Host "`n=== 8. Check Book Stock (After Return) ===" -ForegroundColor Green
$booksAfterReturn = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$booksAfterReturn.books | Where-Object { $_.rfid -in @("RFID001", "RFID002") } | Select-Object rfid, name, book_lefts | Format-Table

Write-Host "`n=== 9. Check Order Status ===" -ForegroundColor Green
$finalOrder = Invoke-RestMethod -Uri "http://localhost:3000/api/orders/$($newOrder.order.order_id)" -Method Get
Write-Host "Order Status: $($finalOrder.order.status)"

Write-Host "`n=== Test Complete! ===" -ForegroundColor Cyan
```

---

## Expected Results

### Initial State:
```
RFID001: book_lefts = 5
RFID002: book_lefts = 3
```

### After Create Order:
```
RFID001: book_lefts = 5 (không thay đổi)
RFID002: book_lefts = 3 (không thay đổi)
Order Status: pending
```

### After Robot Borrow:
```
RFID001: book_lefts = 4 (giảm 1)
RFID002: book_lefts = 2 (giảm 1)
Order Status: pending (vẫn pending vì chưa trả)
```

### After Robot Return:
```
RFID001: book_lefts = 5 (tăng 1)
RFID002: book_lefts = 3 (tăng 1)
Order Status: completed (tự động complete vì đã trả hết)
```

---

## Notes

- Thay `userId` và `orderId` phù hợp với data trong database
- Chạy `database/setup.sql` để reset data nếu cần
- Kiểm tra console/terminal của server để xem logs
