import crypto from 'crypto';
import moment from 'moment';
import querystring from 'qs';

// Cấu hình cố định
const VNP_TMN_CODE = 'OX65XCPS';
const VNP_HASH_SECRET = '2LAGBSMP00A73DOEN9VKJ9U1S2PTPA3P';
const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = 'http://localhost:5000/api/payments/vnpay-return';
const VNP_VERSION = '2.1.0';
const VNP_COMMAND = 'pay';
const VNP_CURRENCY_CODE = 'VND';

/**
 * Hàm sắp xếp các tham số theo thứ tự ABC
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj);
  keys.sort();
  keys.forEach((key) => {
    if (obj[key] !== null && obj[key] !== undefined) {
      sorted[key] = obj[key];
    }
  });
  return sorted;
}

/**
 * Tạo URL thanh toán VNPay
 * @param {string} orderId - ID đơn hàng
 * @param {number} amount - Số tiền thanh toán (đơn vị VND)
 * @param {string} orderInfo - Thông tin đơn hàng
 * @param {string} clientIp - IP của khách hàng
 * @param {string} orderCode - Mã đơn hàng (ví dụ: DH12345)
 * @returns {string} URL thanh toán VNPay
 */
export function createPayment(orderId, amount, orderInfo, clientIp, orderCode) {
  try {
    // Kiểm tra dữ liệu đầu vào
    if (!orderId || !amount || !orderInfo || !clientIp || !orderCode) {
      throw new Error('Thiếu tham số bắt buộc (bao gồm orderCode)');
    }

    console.log('=== CREATING VNPAY PAYMENT ===');
    console.log('Input params:', { orderId, amount, orderInfo, clientIp, orderCode });

    // Lấy thời gian hiện tại
    const createDate = moment().format('YYYYMMDDHHmmss');
    
    // Tạo mã giao dịch duy nhất kết hợp với timestamp
    const txnRef = orderCode;
    
    // Tạo đối tượng tham số
    const params = {
      vnp_Version: VNP_VERSION,
      vnp_Command: VNP_COMMAND,
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Locale: 'vn',
      vnp_CurrCode: VNP_CURRENCY_CODE,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(amount * 100), // Nhân 100 vì đơn vị nhỏ nhất của VNPay
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate,
    };
    
    console.log('Raw params:', params);
    
    // Sắp xếp tham số theo thứ tự ABC
    const sortedParams = sortObject(params);
    console.log('Sorted params:', sortedParams);
    
    // Tạo chuỗi tham số để ký
    const signData = querystring.stringify(sortedParams, { encode: false });
    console.log('Sign data (raw string):', signData);
    
    // Tạo chữ ký
    const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    console.log('Generated signature:', signed);
    
    // Thêm chữ ký vào tham số
    sortedParams.vnp_SecureHash = signed;
    
    // Tạo URL hoàn chỉnh
    const paymentUrl = `${VNP_URL}?${querystring.stringify(sortedParams, { encode: true })}`;
    console.log('Final payment URL:', paymentUrl);
    
    return paymentUrl;
  } catch (error) {
    console.error('Error creating VNPAY payment URL:', error);
    throw error;
  }
}

/**
 * Xác thực callback từ VNPay
 * @param {Object} vnpParams - Các tham số callback từ VNPay
 * @returns {boolean} Kết quả xác thực
 */
export function verifyPayment(vnpParams) {
  try {
    console.log('=== VERIFYING VNPAY PAYMENT ===');
    console.log('Callback params:', vnpParams);
    
    // Lấy chữ ký từ request
    const secureHash = vnpParams.vnp_SecureHash;
    
    // Tạo bản sao của tham số và xóa chữ ký để tạo lại
    const params = { ...vnpParams };
    delete params.vnp_SecureHash;
    if (params.vnp_SecureHashType) {
      delete params.vnp_SecureHashType;
    }
    
    // Sắp xếp tham số theo thứ tự ABC
    const sortedParams = sortObject(params);
    console.log('Sorted params for verification:', sortedParams);
    
    // Tạo chuỗi tham số để kiểm tra chữ ký
    const signData = querystring.stringify(sortedParams, { encode: false });
    console.log('Sign data for verification:', signData);
    
    // Tạo chữ ký để so sánh
    const hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    console.log('Generated signature:', signed);
    console.log('Original signature:', secureHash);
    
    // So sánh chữ ký
    const isValid = secureHash === signed;
    console.log('Signature is valid:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Error verifying VNPAY payment:', error);
    throw error;
  }
} 