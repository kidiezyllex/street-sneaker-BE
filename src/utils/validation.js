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