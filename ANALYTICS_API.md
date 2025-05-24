# API Thống Kê Phân Tích (Analytics API)

## Endpoint
```
GET /api/statistics/analytics
```

## Mô tả
API này cung cấp thống kê tổng quan về doanh thu, đơn hàng, lợi nhuận và khách hàng mới với khả năng lọc theo khoảng thời gian.

## Tham số (Query Parameters)

| Tham số | Kiểu dữ liệu | Bắt buộc | Mô tả |
|---------|--------------|----------|-------|
| `days` | integer | Không | Số ngày để lọc dữ liệu (1, 30, 90). Không truyền thì lấy tất cả thời gian |

## Ví dụ sử dụng

### 1. Lấy thống kê tất cả thời gian
```bash
GET /api/statistics/analytics
```

### 2. Lấy thống kê 1 ngày gần nhất
```bash
GET /api/statistics/analytics?days=1
```

### 3. Lấy thống kê 30 ngày gần nhất
```bash
GET /api/statistics/analytics?days=30
```

### 4. Lấy thống kê 90 ngày gần nhất
```bash
GET /api/statistics/analytics?days=90
```

## Response

### Thành công (200)
```json
{
  "success": true,
  "message": "Lấy thống kê phân tích thành công",
  "data": {
    "period": "30 ngày gần nhất",
    "totalRevenue": 15000000,
    "totalOrders": 150,
    "totalProfit": 4500000,
    "newCustomers": 25,
    "growthRate": "12.5%",
    "ordersByStatus": [
      {
        "_id": "HOAN_THANH",
        "count": 120
      },
      {
        "_id": "DA_GIAO_HANG",
        "count": 20
      },
      {
        "_id": "CHO_XAC_NHAN",
        "count": 10
      }
    ],
    "revenueByPaymentMethod": [
      {
        "_id": "BANK_TRANSFER",
        "revenue": 8000000,
        "count": 80
      },
      {
        "_id": "COD",
        "revenue": 5000000,
        "count": 50
      },
      {
        "_id": "CASH",
        "revenue": 2000000,
        "count": 20
      }
    ],
    "topProducts": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "totalQuantity": 45,
        "totalRevenue": 2250000,
        "productName": "Giày Nike Air Max",
        "productCode": "PRD000001"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "totalQuantity": 38,
        "totalRevenue": 1900000,
        "productName": "Giày Adidas Ultraboost",
        "productCode": "PRD000002"
      }
    ],
    "averageOrderValue": "100000.00"
  }
}
```

### Lỗi (500)
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi lấy thống kê phân tích",
  "error": "Chi tiết lỗi"
}
```

## Mô tả các trường dữ liệu

### Dữ liệu chính
- **period**: Khoảng thời gian thống kê
- **totalRevenue**: Tổng doanh thu từ các đơn hàng đã hoàn thành và đã thanh toán
- **totalOrders**: Tổng số đơn hàng (không bao gồm đơn hàng đã hủy)
- **totalProfit**: Tổng lợi nhuận (tính theo 30% doanh thu - có thể điều chỉnh)
- **newCustomers**: Số khách hàng mới đăng ký
- **growthRate**: Tỷ lệ tăng trưởng doanh thu so với kỳ trước (chỉ có khi truyền tham số days)
- **averageOrderValue**: Giá trị đơn hàng trung bình

### Dữ liệu bổ sung
- **ordersByStatus**: Thống kê số lượng đơn hàng theo từng trạng thái
- **revenueByPaymentMethod**: Doanh thu và số lượng đơn hàng theo phương thức thanh toán
- **topProducts**: Top 5 sản phẩm bán chạy nhất với số lượng và doanh thu

## Xác thực
API này yêu cầu:
- Bearer token trong header Authorization
- Quyền ADMIN

## Trạng thái đơn hàng được tính
- **Doanh thu**: Chỉ tính các đơn hàng có trạng thái `DA_GIAO_HANG` hoặc `HOAN_THANH` và đã thanh toán (`PAID`)
- **Tổng đơn hàng**: Tất cả đơn hàng trừ đơn hàng đã hủy (`DA_HUY`)

## Logic tính lợi nhuận
Hiện tại lợi nhuận được tính bằng 30% doanh thu. Bạn có thể điều chỉnh tỷ lệ này trong code tại biến `profitMargin` trong controller.

## Ghi chú
- Tỷ lệ tăng trưởng chỉ được tính khi có tham số `days`
- Tỷ lệ tăng trưởng so sánh với cùng kỳ trước đó (ví dụ: 30 ngày gần nhất so với 30 ngày trước đó)
- Top products được sắp xếp theo số lượng bán ra, giới hạn 5 sản phẩm 