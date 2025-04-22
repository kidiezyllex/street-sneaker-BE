const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD', 
  EWALLET: 'EWALLET'
};

// Xử lý thanh toán theo phương thức
exports.processPaymentByMethod = async (order, method, paymentDetails) => {
  switch (method) {
    case PAYMENT_METHODS.CASH:
      return processCashPayment(order);
    case PAYMENT_METHODS.CARD:
      return processCardPayment(order, paymentDetails);
    case PAYMENT_METHODS.EWALLET:
      return processEWalletPayment(order, paymentDetails);
    default:
      throw new Error('Phương thức thanh toán không hợp lệ');
  }
};

const processCashPayment = (order) => {
  return {
    success: true,
    message: 'Thanh toán tiền mặt thành công',
    transactionId: `CASH_${Date.now()}`
  };
};

const processCardPayment = async (order, details) => {
  // TODO: Tích hợp cổng thanh toán thẻ
  return {
    success: true,
    message: 'Thanh toán thẻ thành công',
    transactionId: `CARD_${Date.now()}`
  };
};

const processEWalletPayment = async (order, details) => {
  // TODO: Tích hợp ví điện tử
  return {
    success: true,
    message: 'Thanh toán ví điện tử thành công',
    transactionId: `EWALLET_${Date.now()}`
  };
}; 