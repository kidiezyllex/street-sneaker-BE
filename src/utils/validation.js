// Validate danh sách sản phẩm trong đơn hàng
export const validateOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return 'Danh sách sản phẩm không hợp lệ';
  }

  if (items.length === 0) {
    return 'Đơn hàng phải có ít nhất một sản phẩm';
  }

  for (const item of items) {
    if (!item.product || !item.quantity) {
      return 'Thông tin sản phẩm không đầy đủ';
    }

    if (item.quantity <= 0) {
      return 'Số lượng sản phẩm phải lớn hơn 0';
    }
  }

  return null;
};

/**
 * Validates an order data.
 * @param {object} orderData - The order data to validate.
 * @returns {object} - The validated order data.
 * @throws {Error} - If validation fails.
 */
export const validateOrder = (orderData) => {
  if (!orderData) {
    throw new Error('Dữ liệu đơn hàng không được để trống');
  }

  // Validate items (optional on create, can be added later)
  if (orderData.items) {
    const itemsError = validateOrderItems(orderData.items);
    if (itemsError) {
      throw new Error(itemsError);
    }
  }

  // Return validated data
  return {
    items: orderData.items || [],
    customer: orderData.customer,
    status: orderData.status || 'PENDING',
    note: orderData.note,
    subtotal: orderData.subtotal || 0,
    discount: orderData.discount || 0,
    tax: orderData.tax || 0,
    totalAmount: orderData.totalAmount || 0,
    paidAmount: orderData.paidAmount || 0
  };
};

/**
 * Validates an order item data.
 * @param {object} itemData - The order item data to validate.
 * @returns {object} - The validated order item data.
 * @throws {Error} - If validation fails.
 */
export const validateOrderItem = (itemData) => {
  if (!itemData) {
    throw new Error('Dữ liệu sản phẩm không được để trống');
  }

  if (!itemData.productId) {
    throw new Error('ID sản phẩm không được để trống');
  }

  if (!itemData.variantId) {
    throw new Error('ID biến thể sản phẩm không được để trống');
  }

  if (!itemData.quantity || isNaN(itemData.quantity) || itemData.quantity <= 0) {
    throw new Error('Số lượng sản phẩm phải lớn hơn 0');
  }

  return {
    productId: itemData.productId,
    variantId: itemData.variantId,
    quantity: parseInt(itemData.quantity)
  };
};

/**
 * Validates payment data.
 * @param {object} paymentData - The payment data to validate.
 * @returns {object} - The validated payment data.
 * @throws {Error} - If validation fails.
 */
export const validatePayment = (paymentData) => {
  if (!paymentData) {
    throw new Error('Dữ liệu thanh toán không được để trống');
  }

  if (!paymentData.amount || isNaN(paymentData.amount) || paymentData.amount <= 0) {
    throw new Error('Số tiền thanh toán phải lớn hơn 0');
  }

  if (!paymentData.method) {
    throw new Error('Phương thức thanh toán không được để trống');
  }

  const validMethods = ['CASH', 'CARD', 'BANKING', 'MOMO', 'ZALOPAY', 'OTHER'];
  if (!validMethods.includes(paymentData.method)) {
    throw new Error('Phương thức thanh toán không hợp lệ');
  }

  return {
    amount: parseFloat(paymentData.amount),
    method: paymentData.method,
    note: paymentData.note
  };
};

/**
 * Validates account data.
 * @param {object} accountData - The account data to validate.
 * @returns {object} - The validated account data.
 * @throws {Error} - If validation fails.
 */
export const validateAccount = (accountData) => {
    if (!accountData) {
        throw new Error('Account data is required.');
    }

    // Validate fullName
    if (!accountData.fullName || accountData.fullName.trim() === '') {
        throw new Error('Full name is required.');
    }

    // Validate email
    if (!accountData.email || accountData.email.trim() === '') {
        throw new Error('Email is required.');
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(accountData.email)) {
        throw new Error('Invalid email format.');
    }

    // Validate phoneNumber (optional)
    if (accountData.phoneNumber) {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(accountData.phoneNumber)) {
            throw new Error('Invalid phone number format (must be 10 digits).');
        }
    }

    // Validate password (ensure length >= 6)
    if (!accountData.password || accountData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }

    return accountData;
};

// Validate thông tin địa chỉ
export const validateAddress = (addressData) => {
  if (!addressData) {
    throw new Error('Dữ liệu địa chỉ không được để trống');
  }

  // Kiểm tra người nhận
  if (!addressData.receiverName || addressData.receiverName.trim() === '') {
    throw new Error('Tên người nhận không được để trống');
  }

  // Kiểm tra số điện thoại
  if (!addressData.receiverPhone || addressData.receiverPhone.trim() === '') {
    throw new Error('Số điện thoại người nhận không được để trống');
  }

  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(addressData.receiverPhone)) {
    throw new Error('Số điện thoại không đúng định dạng');
  }

  // Kiểm tra địa chỉ cụ thể
  if (!addressData.addressDetail || addressData.addressDetail.trim() === '') {
    throw new Error('Địa chỉ cụ thể không được để trống');
  }

  // Kiểm tra tỉnh/thành phố
  if (!addressData.province || addressData.province.trim() === '') {
    throw new Error('Tỉnh/thành phố không được để trống');
  }

  // Kiểm tra quận/huyện
  if (!addressData.district || addressData.district.trim() === '') {
    throw new Error('Quận/huyện không được để trống');
  }

  // Kiểm tra phường/xã
  if (!addressData.ward || addressData.ward.trim() === '') {
    throw new Error('Phường/xã không được để trống');
  }

  return addressData;
};

// Validate mật khẩu
export const validatePassword = (passwordData) => {
  if (!passwordData) {
    throw new Error('Dữ liệu mật khẩu không được để trống');
  }

  // Kiểm tra mật khẩu hiện tại
  if (!passwordData.currentPassword || passwordData.currentPassword.trim() === '') {
    throw new Error('Mật khẩu hiện tại không được để trống');
  }

  // Kiểm tra mật khẩu mới
  if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
  }

  // Kiểm tra xác nhận mật khẩu
  if (passwordData.confirmPassword !== passwordData.newPassword) {
    throw new Error('Xác nhận mật khẩu không khớp');
  }

  return passwordData;
};

// Validate thông tin vận chuyển
export const validateShippingInfo = (shippingInfo) => {
  if (!shippingInfo) {
    return 'Thông tin vận chuyển không được để trống';
  }
  if (!shippingInfo.address) {
    return 'Địa chỉ không được để trống';
  }
  if (!shippingInfo.phone) {
    return 'Số điện thoại không được để trống';
  }
  // Có thể thêm các kiểm tra định dạng số điện thoại, địa chỉ chi tiết hơn tại đây

  return shippingInfo; // Trả về thông tin đã được xác thực
};

// Validate thông tin đơn trả hàng
export const validateReturn = (returnData) => {
  if (!returnData) {
    throw new Error('Dữ liệu trả hàng không được để trống');
  }

  // Kiểm tra lý do trả hàng
  if (!returnData.reason || returnData.reason.trim() === '') {
    throw new Error('Lý do trả hàng không được để trống');
  }

  // Kiểm tra danh sách sản phẩm trả
  if (!Array.isArray(returnData.items) || returnData.items.length === 0) {
    throw new Error('Danh sách sản phẩm trả không hợp lệ');
  }

  // Kiểm tra từng sản phẩm trong danh sách
  for (const item of returnData.items) {
    if (!item.product) {
      throw new Error('ID sản phẩm không được để trống');
    }
    
    if (!item.variant) {
      throw new Error('ID biến thể không được để trống');
    }
    
    if (!item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
      throw new Error('Số lượng sản phẩm phải lớn hơn 0');
    }
  }

  return returnData; // Trả về dữ liệu đã được xác thực
};

// Validate thông tin voucher
export const validateVoucher = (voucherData) => {
  if (!voucherData) {
    throw new Error('Dữ liệu voucher không được để trống');
  }

  // Kiểm tra mã voucher
  if (!voucherData.code || voucherData.code.trim() === '') {
    throw new Error('Mã voucher không được để trống');
  }

  // Kiểm tra tên voucher
  if (!voucherData.name || voucherData.name.trim() === '') {
    throw new Error('Tên voucher không được để trống');
  }

  // Kiểm tra giá trị voucher
  if (!voucherData.value || isNaN(voucherData.value) || voucherData.value <= 0) {
    throw new Error('Giá trị voucher phải lớn hơn 0');
  }

  // Kiểm tra loại voucher
  if (!voucherData.type || !['PHAN_TRAM', 'TIEN_MAT'].includes(voucherData.type)) {
    throw new Error('Loại voucher không hợp lệ');
  }

  // Kiểm tra phần trăm giảm giá (nếu là voucher phần trăm)
  if (voucherData.type === 'PHAN_TRAM' && (voucherData.value <= 0 || voucherData.value > 100)) {
    throw new Error('Giá trị phần trăm phải nằm trong khoảng (0, 100]');
  }

  // Kiểm tra thời gian hiệu lực
  if (!voucherData.startDate || !voucherData.endDate) {
    throw new Error('Thời gian hiệu lực voucher không được để trống');
  }

  if (new Date(voucherData.startDate) >= new Date(voucherData.endDate)) {
    throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
  }

  return voucherData;
};

// Validate thông tin khuyến mãi sản phẩm
export const validateProductPromotion = (promotionData) => {
  if (!promotionData) {
    throw new Error('Dữ liệu khuyến mãi không được để trống');
  }

  // Kiểm tra sản phẩm
  if (!promotionData.product) {
    throw new Error('ID sản phẩm không được để trống');
  }

  // Kiểm tra khuyến mãi
  if (!promotionData.promotion) {
    throw new Error('ID khuyến mãi không được để trống');
  }

  // Kiểm tra thời gian hiệu lực
  if (promotionData.startDate && promotionData.endDate) {
    if (new Date(promotionData.startDate) >= new Date(promotionData.endDate)) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }
  }

  return promotionData;
}; 