# 🧪 Test Nghiệp Vụ Mới - Trừ book_lefts Ngay Khi Tạo Order

## PowerShell Test Script

### Test 1: Kiểm tra book_lefts giảm ngay khi tạo order

```powershell
Write-Host "=== TEST: Tạo order trừ book_lefts ngay ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n1. Login user..." -ForegroundColor Green
$loginBody = @{
    email = "user1@library.com"
    password = "user123"
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
Write-Host "✓ User ID: $($user.user.user_id)"

# 2. Check book_lefts TRƯỚC khi tạo order
Write-Host "`n2. Check book_lefts TRƯỚC tạo order..." -ForegroundColor Green
$booksBefore = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$book1Before = $booksBefore.books | Where-Object { $_.rfid -eq "RFID001" }
$book2Before = $booksBefore.books | Where-Object { $_.rfid -eq "RFID002" }

Write-Host "   RFID001: book_lefts = $($book1Before.book_lefts)" -ForegroundColor Yellow
Write-Host "   RFID002: book_lefts = $($book2Before.book_lefts)" -ForegroundColor Yellow

# 3. Tạo order
Write-Host "`n3. Tạo order với RFID001 và RFID002..." -ForegroundColor Green
$orderBody = @{
    userId = $user.user.user_id
    bookRfids = @("RFID001", "RFID002")
} | ConvertTo-Json

$order = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
Write-Host "✓ Order ID: $($order.order.order_id)"

# 4. Check book_lefts SAU khi tạo order
Write-Host "`n4. Check book_lefts SAU tạo order..." -ForegroundColor Green
$booksAfter = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$book1After = $booksAfter.books | Where-Object { $_.rfid -eq "RFID001" }
$book2After = $booksAfter.books | Where-Object { $_.rfid -eq "RFID002" }

Write-Host "   RFID001: book_lefts = $($book1After.book_lefts)" -ForegroundColor Yellow
Write-Host "   RFID002: book_lefts = $($book2After.book_lefts)" -ForegroundColor Yellow

# 5. So sánh
Write-Host "`n5. Kết quả:" -ForegroundColor Green
$diff1 = $book1Before.book_lefts - $book1After.book_lefts
$diff2 = $book2Before.book_lefts - $book2After.book_lefts

if ($diff1 -eq 1 -and $diff2 -eq 1) {
    Write-Host "   ✅ PASS: book_lefts đã giảm 1 cho mỗi sách!" -ForegroundColor Green
    Write-Host "   RFID001: $($book1Before.book_lefts) → $($book1After.book_lefts) (giảm $diff1)" -ForegroundColor Green
    Write-Host "   RFID002: $($book2Before.book_lefts) → $($book2After.book_lefts) (giảm $diff2)" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL: book_lefts không giảm đúng!" -ForegroundColor Red
}

# 6. Test Robot borrow (không trừ nữa)
Write-Host "`n6. Test Robot borrow (không trừ book_lefts)..." -ForegroundColor Green
$borrowBody = @{
    orderId = $order.order.order_id
} | ConvertTo-Json

$borrowResult = Invoke-RestMethod -Uri "http://localhost:3000/api/robot/borrow" -Method Post -Body $borrowBody -ContentType "application/json"
Write-Host "✓ $($borrowResult.message)"

# Check book_lefts sau robot borrow
$booksAfterBorrow = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$book1AfterBorrow = $booksAfterBorrow.books | Where-Object { $_.rfid -eq "RFID001" }
$book2AfterBorrow = $booksAfterBorrow.books | Where-Object { $_.rfid -eq "RFID002" }

Write-Host "   RFID001: book_lefts = $($book1AfterBorrow.book_lefts)" -ForegroundColor Yellow
Write-Host "   RFID002: book_lefts = $($book2AfterBorrow.book_lefts)" -ForegroundColor Yellow

if ($book1AfterBorrow.book_lefts -eq $book1After.book_lefts -and $book2AfterBorrow.book_lefts -eq $book2After.book_lefts) {
    Write-Host "   ✅ PASS: book_lefts KHÔNG đổi sau robot borrow!" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL: book_lefts đã thay đổi!" -ForegroundColor Red
}

# 7. Test Robot return (cộng lại)
Write-Host "`n7. Test Robot return (cộng book_lefts)..." -ForegroundColor Green
$returnBody = @{
    orderId = $order.order.order_id
    rfids = @("RFID001", "RFID002")
} | ConvertTo-Json

$returnResult = Invoke-RestMethod -Uri "http://localhost:3000/api/robot/return" -Method Post -Body $returnBody -ContentType "application/json"
Write-Host "✓ $($returnResult.message)"

# Check book_lefts sau robot return
$booksAfterReturn = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$book1AfterReturn = $booksAfterReturn.books | Where-Object { $_.rfid -eq "RFID001" }
$book2AfterReturn = $booksAfterReturn.books | Where-Object { $_.rfid -eq "RFID002" }

Write-Host "   RFID001: book_lefts = $($book1AfterReturn.book_lefts)" -ForegroundColor Yellow
Write-Host "   RFID002: book_lefts = $($book2AfterReturn.book_lefts)" -ForegroundColor Yellow

if ($book1AfterReturn.book_lefts -eq $book1Before.book_lefts -and $book2AfterReturn.book_lefts -eq $book2Before.book_lefts) {
    Write-Host "   ✅ PASS: book_lefts đã về lại số ban đầu!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARNING: book_lefts khác số ban đầu" -ForegroundColor Yellow
    Write-Host "   RFID001: $($book1Before.book_lefts) → $($book1AfterReturn.book_lefts)" -ForegroundColor Yellow
    Write-Host "   RFID002: $($book2Before.book_lefts) → $($book2AfterReturn.book_lefts)" -ForegroundColor Yellow
}

Write-Host "`n=== TEST HOÀN THÀNH ===" -ForegroundColor Cyan
```

---

## Test 2: Không cho đặt sách đã hết

```powershell
Write-Host "=== TEST: Không cho đặt sách hết hàng ===" -ForegroundColor Cyan

# Tạo sách test với book_lefts = 1
$newBookBody = @{
    rfid = "TEST_BOOK"
    name = "Test Book"
    book_lefts = 1
    position_x = 1.0
    position_y = 1.0
    position_z = 1.0
} | ConvertTo-Json

try {
    $newBook = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Post -Body $newBookBody -ContentType "application/json"
    Write-Host "✓ Đã tạo test book với book_lefts = 1"
} catch {
    Write-Host "Book đã tồn tại, skip..."
}

# Login
$loginBody = @{
    email = "user1@library.com"
    password = "user123"
} | ConvertTo-Json
$user = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"

# User 1 tạo order
Write-Host "`nUser 1 tạo order với TEST_BOOK..."
$order1Body = @{
    userId = $user.user.user_id
    bookRfids = @("TEST_BOOK")
} | ConvertTo-Json

$order1 = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Post -Body $order1Body -ContentType "application/json"
Write-Host "✓ Order 1 tạo thành công: #$($order1.order.order_id)"

# Check book_lefts
$books = Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Get
$testBook = $books.books | Where-Object { $_.rfid -eq "TEST_BOOK" }
Write-Host "✓ TEST_BOOK book_lefts = $($testBook.book_lefts) (đã giảm về 0)"

# User 2 cố tạo order (phải fail)
Write-Host "`nUser 2 cố tạo order với TEST_BOOK (phải fail)..."
try {
    $order2Body = @{
        userId = $user.user.user_id
        bookRfids = @("TEST_BOOK")
    } | ConvertTo-Json
    
    $order2 = Invoke-RestMethod -Uri "http://localhost:3000/api/orders" -Method Post -Body $order2Body -ContentType "application/json"
    Write-Host "❌ FAIL: Cho phép tạo order khi sách hết!" -ForegroundColor Red
} catch {
    Write-Host "✅ PASS: Từ chối tạo order khi sách hết!" -ForegroundColor Green
    Write-Host "   Error: $($_.Exception.Message)"
}

# Cleanup: Xóa test book
Write-Host "`nCleanup..."
try {
    $deleteBody = @{ rfid = "TEST_BOOK" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:3000/api/books" -Method Delete -Body $deleteBody -ContentType "application/json"
    Write-Host "✓ Đã xóa test book"
} catch {
    Write-Host "⚠️  Không xóa được (có order đang dùng)"
}

Write-Host "`n=== TEST HOÀN THÀNH ===" -ForegroundColor Cyan
```

---

## Expected Results

### Test 1:
```
1. Login user... ✓
2. RFID001: book_lefts = 5
   RFID002: book_lefts = 3
3. Tạo order... ✓
4. RFID001: book_lefts = 4 (giảm 1) ✅
   RFID002: book_lefts = 2 (giảm 1) ✅
5. Robot borrow...
   book_lefts KHÔNG đổi ✅
6. Robot return...
   book_lefts tăng lại ✅
```

### Test 2:
```
1. Tạo book với book_lefts = 1
2. User 1 tạo order → book_lefts = 0 ✅
3. User 2 tạo order → ❌ Lỗi "Sách đã hết" ✅
```

---

## Manual Test trong Browser

1. **Login**: user1@library.com / user123
2. **Tab Duyệt sách**: Ghi nhớ book_lefts của một cuốn (ví dụ: 5)
3. **Thêm vào giỏ** → **Tạo đơn hàng**
4. **Quay lại tab Duyệt sách** → ✅ book_lefts đã giảm (ví dụ: 4)
5. **F5 refresh page** → ✅ Vẫn hiển thị đúng (4)

---

Chạy script trên để verify nghiệp vụ mới!
