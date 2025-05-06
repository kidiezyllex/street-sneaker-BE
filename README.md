# API Documentation - Street Sneaker

Tài liệu này mô tả chi tiết các API của hệ thống Street Sneaker.

## Mục lục

1. [Quản lý Sản phẩm](#1-quản-lý-sản-phẩm)
2. [Quản lý Voucher](#2-quản-lý-voucher)
3. [Quản lý Khuyến mãi](#3-quản-lý-khuyến-mãi-promotion)
4. [Quản lý Đơn hàng](#4-quản-lý-đơn-hàng)
5. [Quản lý Trả hàng](#5-quản-lý-trả-hàng)
6. [Quản lý Tài khoản](#6-quản-lý-tài-khoản)
7. [Thống kê và Báo cáo](#7-thống-kê-và-báo-cáo)
8. [Xác thực và Phân quyền](#8-xác-thực-và-phân-quyền)

## Giới thiệu chung

- Base URL: `http://localhost:5000` (hoặc domain triển khai)
- Xác thực: Sử dụng JWT Token trong header `Authorization: Bearer {token}`
- Format dữ liệu: JSON

## 1. Quản lý Sản phẩm

### 1.1. Tạo sản phẩm mới
- **Route**: `/api/products`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "string",
    "brand": "string",
    "category": "string",
    "material": "string",
    "description": "string",
    "weight": "number",
    "variants": [
      {
        "colorId": "string",
        "sizeId": "string",
        "price": "number",
        "stock": "number",
        "images": ["string"]
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "brand": "string",
      "category": "string",
      "material": "string",
      "description": "string",
      "weight": "number",
      "variants": [...],
      "status": "HOAT_DONG",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 1.2. Lấy danh sách sản phẩm
- **Route**: `/api/products`
- **Method**: GET
- **Request Params**:
  - `name` (string, optional): Tìm kiếm theo tên
  - `brand` (string, optional): Lọc theo thương hiệu
  - `category` (string, optional): Lọc theo danh mục
  - `material` (string, optional): Lọc theo chất liệu
  - `color` (string, optional): Lọc theo màu sắc
  - `size` (string, optional): Lọc theo kích cỡ
  - `minPrice` (number, optional): Giá thấp nhất
  - `maxPrice` (number, optional): Giá cao nhất
  - `status` (string, optional): Trạng thái (HOAT_DONG/KHONG_HOAT_DONG)
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng sản phẩm mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "name": "string",
        "brand": "object",
        "category": "object",
        "material": "object",
        "variants": [...],
        "status": "string"
      }
    ]
  }
  ```

### 1.3. Lấy các bộ lọc sản phẩm
- **Route**: `/api/products/filters`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "colors": [...],
      "sizes": [...],
      "brands": [...],
      "categories": [...],
      "materials": [...],
      "priceRange": {
        "min": "number",
        "max": "number"
      }
    }
  }
  ```

### 1.4. Tìm kiếm sản phẩm
- **Route**: `/api/products/search`
- **Method**: GET
- **Request Params**:
  - `keyword` (string, required): Từ khóa tìm kiếm
  - (Các bộ lọc tương tự như lấy danh sách sản phẩm)
- **Response**: (Tương tự response lấy danh sách sản phẩm)

### 1.5. Lấy chi tiết sản phẩm
- **Route**: `/api/products/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "brand": "object",
      "category": "object",
      "material": "object",
      "description": "string",
      "weight": "number",
      "variants": [...],
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 1.6. Cập nhật sản phẩm
- **Route**: `/api/products/:id`
- **Method**: PUT
- **Payload**: (Tương tự như tạo sản phẩm, các trường có thể cập nhật một phần)
- **Response**: 
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "brand": "string",
      "category": "string",
      "material": "string",
      "description": "string",
      "weight": "number",
      "variants": [...],
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 1.7. Xóa sản phẩm
- **Route**: `/api/products/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa sản phẩm thành công"
  }
  ```

### 1.8. Cập nhật trạng thái sản phẩm
- **Route**: `/api/products/:id/status`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "status": "HOAT_DONG | KHONG_HOAT_DONG"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 1.9. Cập nhật tồn kho
- **Route**: `/api/products/:id/stock`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "variantUpdates": [
      {
        "variantId": "string",
        "stock": "number"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "variants": [...],
      "updatedAt": "date"
    }
  }
  ```

### 1.10. Cập nhật hình ảnh
- **Route**: `/api/products/:id/images`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "variantId": "string",
    "images": ["string"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "variants": [...],
      "updatedAt": "date"
    }
  }
  ```

## 2. Quản lý Voucher

### 2.1. Tạo phiếu giảm giá
- **Route**: `/api/vouchers`
- **Method**: POST
- **Payload**:
  ```json
  {
    "code": "string",
    "name": "string",
    "type": "PERCENTAGE | FIXED_AMOUNT",
    "value": "number",
    "quantity": "number",
    "startDate": "date",
    "endDate": "date",
    "minOrderValue": "number",
    "maxDiscount": "number",
    "status": "HOAT_DONG | KHONG_HOAT_DONG"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "code": "string",
      "name": "string",
      "type": "string",
      "value": "number",
      "quantity": "number",
      "usedCount": 0,
      "startDate": "date",
      "endDate": "date",
      "minOrderValue": "number",
      "maxDiscount": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 2.2. Lấy danh sách voucher
- **Route**: `/api/vouchers`
- **Method**: GET
- **Request Params**:
  - `code` (string, optional): Lọc theo mã
  - `name` (string, optional): Lọc theo tên
  - `status` (string, optional): Lọc theo trạng thái
  - `startDate` (date, optional): Lọc từ ngày
  - `endDate` (date, optional): Lọc đến ngày
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "code": "string",
        "name": "string",
        "type": "string",
        "value": "number",
        "quantity": "number",
        "usedCount": "number",
        "startDate": "date",
        "endDate": "date",
        "status": "string"
      }
    ]
  }
  ```

### 2.3. Lấy chi tiết voucher
- **Route**: `/api/vouchers/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "code": "string",
      "name": "string",
      "type": "string",
      "value": "number",
      "quantity": "number",
      "usedCount": "number",
      "startDate": "date",
      "endDate": "date",
      "minOrderValue": "number",
      "maxDiscount": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 2.4. Cập nhật voucher
- **Route**: `/api/vouchers/:id`
- **Method**: PUT
- **Payload**: (Các trường có thể cập nhật một phần)
  ```json
  {
    "name": "string",
    "quantity": "number",
    "startDate": "date",
    "endDate": "date",
    "minOrderValue": "number",
    "maxDiscount": "number",
    "status": "HOAT_DONG | KHONG_HOAT_DONG"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết voucher)

### 2.5. Xóa voucher
- **Route**: `/api/vouchers/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa voucher thành công"
  }
  ```

### 2.6. Kiểm tra voucher hợp lệ
- **Route**: `/api/vouchers/validate`
- **Method**: POST
- **Payload**:
  ```json
  {
    "code": "string",
    "orderValue": "number"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "code": "string",
      "type": "string",
      "value": "number",
      "discountAmount": "number",
      "minOrderValue": "number"
    }
  }
  ```

### 2.7. Tăng số lượt sử dụng
- **Route**: `/api/vouchers/:id/increment-usage`
- **Method**: PUT
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "usedCount": "number",
      "updatedAt": "date"
    }
  }
  ```

### 2.8. Gửi thông báo về voucher
- **Route**: `/api/vouchers/:id/notify`
- **Method**: POST
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đã gửi thông báo về voucher tới tất cả khách hàng"
  }
  ```

## 3. Quản lý Khuyến mãi (Promotion)

### 3.1. Tạo chương trình khuyến mãi
- **Route**: `/api/promotions`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "string",
    "description": "string",
    "discountPercent": "number",
    "products": ["string"],
    "startDate": "date",
    "endDate": "date"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "discountPercent": "number",
      "products": ["string"],
      "startDate": "date",
      "endDate": "date",
      "status": "HOAT_DONG",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 3.2. Lấy danh sách khuyến mãi
- **Route**: `/api/promotions`
- **Method**: GET
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái
  - `search` (string, optional): Tìm kiếm theo tên
  - `startDate` (date, optional): Lọc từ ngày
  - `endDate` (date, optional): Lọc đến ngày
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "name": "string",
        "discountPercent": "number",
        "startDate": "date",
        "endDate": "date",
        "status": "string",
        "productCount": "number"
      }
    ]
  }
  ```

### 3.3. Lấy chi tiết khuyến mãi
- **Route**: `/api/promotions/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "name": "string",
      "description": "string",
      "discountPercent": "number",
      "products": [
        {
          "_id": "string",
          "name": "string",
          "brand": "object",
          "category": "object"
        }
      ],
      "startDate": "date",
      "endDate": "date",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 3.4. Cập nhật khuyến mãi
- **Route**: `/api/promotions/:id`
- **Method**: PUT
- **Payload**: (Các trường có thể cập nhật một phần)
  ```json
  {
    "name": "string",
    "description": "string",
    "discountPercent": "number",
    "products": ["string"],
    "startDate": "date",
    "endDate": "date",
    "status": "HOAT_DONG | KHONG_HOAT_DONG"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết khuyến mãi)

### 3.5. Xóa khuyến mãi
- **Route**: `/api/promotions/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa khuyến mãi thành công"
  }
  ```

### 3.6. Lấy khuyến mãi của sản phẩm
- **Route**: `/api/promotions/product/:productId`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "string",
        "name": "string",
        "discountPercent": "number",
        "startDate": "date",
        "endDate": "date",
        "status": "string"
      }
    ]
  }
  ``` 

## 4. Quản lý Đơn hàng

### 4.1. Tạo đơn hàng
- **Route**: `/api/orders`
- **Method**: POST
- **Payload**:
  ```json
  {
    "customer": "string",
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number",
        "price": "number"
      }
    ],
    "voucher": "string",
    "subTotal": "number",
    "discount": "number",
    "total": "number",
    "shippingAddress": {
      "name": "string",
      "phoneNumber": "string",
      "provinceId": "string",
      "districtId": "string",
      "wardId": "string",
      "specificAddress": "string"
    },
    "paymentMethod": "CASH | BANK_TRANSFER | COD | MIXED"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderNumber": "string",
      "customer": "object",
      "items": [...],
      "voucher": "object",
      "subTotal": "number",
      "discount": "number",
      "total": "number",
      "shippingAddress": "object",
      "paymentMethod": "string",
      "orderStatus": "CHO_XAC_NHAN",
      "paymentStatus": "PENDING",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 4.2. Lấy danh sách đơn hàng (Admin)
- **Route**: `/api/orders`
- **Method**: GET
- **Request Params**:
  - `customer` (string, optional): Lọc theo khách hàng
  - `orderStatus` (string, optional): Lọc theo trạng thái đơn hàng
  - `paymentStatus` (string, optional): Lọc theo trạng thái thanh toán
  - `startDate` (date, optional): Lọc từ ngày
  - `endDate` (date, optional): Lọc đến ngày
  - `search` (string, optional): Tìm kiếm theo mã
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "orderNumber": "string",
        "customer": "object",
        "total": "number",
        "orderStatus": "string",
        "paymentStatus": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 4.3. Lấy đơn hàng của người dùng
- **Route**: `/api/orders/my-orders`
- **Method**: GET
- **Request Params**:
  - `orderStatus` (string, optional): Lọc theo trạng thái
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "orderNumber": "string",
        "total": "number",
        "orderStatus": "string",
        "paymentStatus": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 4.4. Lấy chi tiết đơn hàng
- **Route**: `/api/orders/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderNumber": "string",
      "customer": "object",
      "items": [
        {
          "product": "object",
          "variant": "object",
          "quantity": "number",
          "price": "number",
          "subTotal": "number"
        }
      ],
      "voucher": "object",
      "subTotal": "number",
      "discount": "number",
      "total": "number",
      "shippingAddress": "object",
      "paymentMethod": "string",
      "orderStatus": "string",
      "paymentStatus": "string",
      "histories": [
        {
          "status": "string",
          "timestamp": "date",
          "note": "string"
        }
      ],
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 4.5. Cập nhật đơn hàng
- **Route**: `/api/orders/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "shippingAddress": "object",
    "orderStatus": "string",
    "paymentStatus": "string"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết đơn hàng)

### 4.6. Hủy đơn hàng
- **Route**: `/api/orders/:id/cancel`
- **Method**: PATCH
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderStatus": "DA_HUY",
      "histories": [
        {
          "status": "DA_HUY",
          "timestamp": "date",
          "note": "Đơn hàng đã bị hủy"
        }
      ],
      "updatedAt": "date"
    }
  }
  ```

### 4.7. Cập nhật trạng thái đơn hàng
- **Route**: `/api/orders/:id/status`
- **Method**: PATCH
- **Payload**:
  ```json
  {
    "status": "CHO_XAC_NHAN | CHO_GIAO_HANG | DANG_VAN_CHUYEN | DA_GIAO_HANG | HOAN_THANH | DA_HUY"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "orderStatus": "string",
      "histories": [
        {
          "status": "string",
          "timestamp": "date",
          "note": "string"
        }
      ],
      "updatedAt": "date"
    }
  }
  ```

## 5. Quản lý Trả hàng

### 5.1. Tạo đơn trả hàng
- **Route**: `/api/returns`
- **Method**: POST
- **Payload**:
  ```json
  {
    "originalOrder": "string",
    "customer": "string",
    "items": [
      {
        "product": "string",
        "variant": {
          "colorId": "string",
          "sizeId": "string"
        },
        "quantity": "number",
        "price": "number",
        "reason": "string"
      }
    ],
    "totalRefund": "number"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "returnNumber": "string",
      "originalOrder": "string",
      "customer": "object",
      "items": [...],
      "totalRefund": "number",
      "status": "CHO_XU_LY",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 5.2. Lấy danh sách đơn trả hàng
- **Route**: `/api/returns`
- **Method**: GET
- **Request Params**:
  - `status` (string, optional): Lọc theo trạng thái
  - `customer` (string, optional): Lọc theo khách hàng
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "returnNumber": "string",
        "originalOrder": "object",
        "customer": "object",
        "totalRefund": "number",
        "status": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 5.3. Tìm kiếm đơn trả hàng
- **Route**: `/api/returns/search`
- **Method**: GET
- **Request Params**:
  - `query` (string, required): Từ khóa tìm kiếm
- **Response**: (Tương tự response lấy danh sách đơn trả hàng)

### 5.4. Lấy thống kê đơn trả hàng
- **Route**: `/api/returns/stats`
- **Method**: GET
- **Request Params**:
  - `startDate` (date, optional)
  - `endDate` (date, optional)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalReturns": "number",
      "totalRefunded": "number",
      "statusCounts": {
        "CHO_XU_LY": "number",
        "DA_HOAN_TIEN": "number",
        "DA_HUY": "number"
      },
      "topReasons": [
        {
          "reason": "string",
          "count": "number"
        }
      ]
    }
  }
  ```

### 5.5. Lấy chi tiết đơn trả hàng
- **Route**: `/api/returns/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "returnNumber": "string",
      "originalOrder": "object",
      "customer": "object",
      "items": [
        {
          "product": "object",
          "variant": "object",
          "quantity": "number",
          "price": "number",
          "reason": "string",
          "subTotal": "number"
        }
      ],
      "totalRefund": "number",
      "status": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 5.6. Cập nhật đơn trả hàng
- **Route**: `/api/returns/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "items": [...],
    "totalRefund": "number"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết đơn trả hàng)

### 5.7. Cập nhật trạng thái đơn trả hàng
- **Route**: `/api/returns/:id/status`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "status": "CHO_XU_LY | DA_HOAN_TIEN | DA_HUY"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 5.8. Xóa đơn trả hàng
- **Route**: `/api/returns/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa đơn trả hàng thành công"
  }
  ``` 

## 6. Quản lý Tài khoản

### 6.1. Lấy danh sách tài khoản (Admin)
- **Route**: `/api/accounts`
- **Method**: GET
- **Request Params**:
  - `role` (string, optional): Lọc theo vai trò
  - `status` (string, optional): Lọc theo trạng thái
  - `search` (string, optional): Tìm kiếm
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "fullName": "string",
        "email": "string",
        "phoneNumber": "string",
        "role": "string",
        "status": "string",
        "avatar": "string",
        "createdAt": "date"
      }
    ]
  }
  ```

### 6.2. Lấy chi tiết tài khoản (Admin)
- **Route**: `/api/accounts/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "gender": "string",
      "birthday": "date",
      "citizenId": "string",
      "status": "string",
      "avatar": "string",
      "addresses": [
        {
          "_id": "string",
          "name": "string", 
          "phoneNumber": "string",
          "provinceId": "number",
          "districtId": "number",
          "wardId": "number",
          "specificAddress": "string",
          "type": "string",
          "isDefault": "boolean"
        }
      ],
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 6.3. Tạo tài khoản (Đăng ký)
- **Route**: `/api/accounts/register`
- **Method**: POST
- **Payload**:
  ```json
  {
    "fullName": "string",
    "email": "string",
    "password": "string",
    "phoneNumber": "string",
    "role": "CUSTOMER | STAFF | ADMIN",
    "gender": "Nam | Nữ | Khác",
    "birthday": "date",
    "citizenId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "token": "string"
    }
  }
  ```

### 6.4. Cập nhật tài khoản (Admin)
- **Route**: `/api/accounts/:id`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "gender": "Nam | Nữ | Khác",
    "birthday": "date",
    "citizenId": "string",
    "avatar": "string",
    "status": "HOAT_DONG | KHONG_HOAT_DONG"
  }
  ```
- **Response**: (Tương tự response lấy chi tiết tài khoản)

### 6.5. Cập nhật trạng thái tài khoản
- **Route**: `/api/accounts/:id/status`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "status": "HOAT_DONG | KHONG_HOAT_DONG"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

### 6.6. Xóa tài khoản
- **Route**: `/api/accounts/:id`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "message": "Xóa tài khoản thành công"
  }
  ```

### 6.7. Xem hồ sơ cá nhân
- **Route**: `/api/accounts/profile`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "gender": "string",
      "birthday": "date",
      "citizenId": "string",
      "avatar": "string",
      "addresses": [...],
      "createdAt": "date"
    }
  }
  ```

### 6.8. Cập nhật hồ sơ cá nhân
- **Route**: `/api/accounts/profile`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "fullName": "string",
    "phoneNumber": "string",
    "gender": "Nam | Nữ | Khác",
    "birthday": "date",
    "avatar": "string"
  }
  ```
- **Response**: (Tương tự response xem hồ sơ cá nhân)

### 6.9. Đổi mật khẩu
- **Route**: `/api/accounts/profile/password`
- **Method**: PUT
- **Payload**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string",
    "confirmPassword": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đổi mật khẩu thành công"
  }
  ```

### 6.10. Thêm địa chỉ mới
- **Route**: `/api/accounts/profile/addresses`
- **Method**: POST
- **Payload**:
  ```json
  {
    "name": "string",
    "phoneNumber": "string",
    "provinceId": "number",
    "districtId": "number",
    "wardId": "number",
    "specificAddress": "string",
    "type": "Nhà riêng | Văn phòng",
    "isDefault": "boolean"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "addresses": [...],
      "updatedAt": "date"
    }
  }
  ```

### 6.11. Cập nhật địa chỉ
- **Route**: `/api/accounts/profile/addresses/:addressId`
- **Method**: PUT
- **Payload**: (Tương tự payload thêm địa chỉ mới)
- **Response**: (Tương tự response thêm địa chỉ mới)

### 6.12. Xóa địa chỉ
- **Route**: `/api/accounts/profile/addresses/:addressId`
- **Method**: DELETE
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "addresses": [...],
      "updatedAt": "date"
    }
  }
  ```

## 7. Thống kê và Báo cáo

### 7.1. Lấy danh sách thống kê
- **Route**: `/api/statistics`
- **Method**: GET
- **Request Params**:
  - `type` (string, optional): Loại thống kê (DAILY/WEEKLY/MONTHLY/YEARLY)
  - `startDate` (date, optional): Từ ngày
  - `endDate` (date, optional): Đến ngày
  - `page` (number, optional): Số trang
  - `limit` (number, optional): Số lượng mỗi trang
- **Response**:
  ```json
  {
    "success": true,
    "count": "number",
    "totalPages": "number",
    "currentPage": "number",
    "data": [
      {
        "_id": "string",
        "date": "date",
        "type": "string",
        "totalOrders": "number",
        "totalRevenue": "number",
        "totalProfit": "number"
      }
    ]
  }
  ```

### 7.2. Lấy chi tiết thống kê
- **Route**: `/api/statistics/:id`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "date": "date",
      "type": "string",
      "totalOrders": "number",
      "totalRevenue": "number",
      "totalProfit": "number",
      "productsSold": [
        {
          "product": "object",
          "quantity": "number",
          "revenue": "number"
        }
      ],
      "vouchersUsed": [
        {
          "voucher": "object",
          "usageCount": "number",
          "totalDiscount": "number"
        }
      ],
      "customerCount": {
        "new": "number",
        "total": "number"
      },
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### 7.3. Báo cáo doanh thu
- **Route**: `/api/statistics/revenue`
- **Method**: GET
- **Request Params**:
  - `startDate` (date, required): Từ ngày
  - `endDate` (date, required): Đến ngày
  - `type` (string, optional): Loại báo cáo (DAILY/WEEKLY/MONTHLY/YEARLY)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total": "number",
      "series": [
        {
          "date": "string",
          "revenue": "number"
        }
      ],
      "previousPeriod": {
        "total": "number",
        "change": "number",
        "percentChange": "number"
      }
    }
  }
  ```

### 7.4. Báo cáo sản phẩm bán chạy
- **Route**: `/api/statistics/top-products`
- **Method**: GET
- **Request Params**:
  - `startDate` (date, required): Từ ngày
  - `endDate` (date, required): Đến ngày
  - `limit` (number, optional): Số lượng sản phẩm
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "product": {
          "_id": "string",
          "name": "string",
          "brand": "object",
          "category": "object"
        },
        "totalQuantity": "number",
        "totalRevenue": "number"
      }
    ]
  }
  ```

### 7.5. Tạo thống kê ngày
- **Route**: `/api/statistics/generate-daily`
- **Method**: POST
- **Payload**:
  ```json
  {
    "date": "date"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "date": "date",
      "type": "DAILY",
      "totalOrders": "number",
      "totalRevenue": "number",
      "totalProfit": "number",
      "productsSold": [...],
      "vouchersUsed": [...],
      "customerCount": {...},
      "createdAt": "date"
    }
  }
  ```

## 8. Xác thực và Phân quyền

### 8.1. Đăng nhập
- **Route**: `/api/auth/login`
- **Method**: POST
- **Payload**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "role": "string",
      "token": "string"
    }
  }
  ```

### 8.2. Đăng xuất
- **Route**: `/api/auth/logout`
- **Method**: POST
- **Response**:
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công"
  }
  ```

### 8.3. Lấy thông tin người dùng từ token
- **Route**: `/api/auth/me`
- **Method**: GET
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "avatar": "string"
    }
  }
  ```

### 8.4. Làm mới token
- **Route**: `/api/auth/refresh-token`
- **Method**: POST
- **Payload**:
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "token": "string",
      "refreshToken": "string"
    }
  }
  ``` 