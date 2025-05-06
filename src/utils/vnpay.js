import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';

// Cấu hình hardcode để đảm bảo chính xác
const config = {
  vnp_TmnCode: process.env.VNP_TMN_CODE,
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_ReturnUrl: process.env.VNP_RETURN_URL
};

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key]) {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}

export const createPaymentUrl = (orderId, amount, orderInfo, clientIp) => {
  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  
  const tmnCode = config.vnp_TmnCode;
  const secretKey = config.vnp_HashSecret;
  let vnpUrl = config.vnp_Url;
  
  // Tạo mã giao dịch duy nhất (thêm timestamp để tránh trùng lặp)
  const txnRef = `${orderId.substr(orderId.length - 10)}_${Date.now()}`;
  
  // Cấu hình các tham số
  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // Convert to smallest currency unit
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: clientIp,
    vnp_CreateDate: createDate
  };

  // Sắp xếp các tham số theo thứ tự alphabet
  vnp_Params = sortObject(vnp_Params);
  
  // Tạo chuỗi hash
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  // Thêm chữ ký vào request
  vnp_Params['vnp_SecureHash'] = signed;
  
  // Tạo URL hoàn chỉnh
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
  
  console.log('Payment URL:', vnpUrl);
  return vnpUrl;
};

export const verifyReturnUrl = (vnpParams) => {
  const secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];
  
  let vnpParamsCopy = sortObject(vnpParams);
  const secretKey = config.vnp_HashSecret;
  const signData = querystring.stringify(vnpParamsCopy, { encode: false });
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  return secureHash === signed;
}; 