import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';

// Cấu hình cứng để đảm bảo chính xác
const config = {
  vnp_TmnCode: 'OX65XCPS',
  vnp_HashSecret: '2LAGBSMP00A73DOEN9VKJ9U1S2PTPA3P',
  vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: 'http://localhost:5000/api/payments/vnpay-return'
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

export const createNewPaymentUrl = (orderId, amount, orderInfo, clientIp) => {
  // Log các tham số đầu vào
  console.log('Creating VNPay URL with params:', { orderId, amount, orderInfo, clientIp });
  console.log('Using config:', config);

  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');
  
  const tmnCode = config.vnp_TmnCode;
  const secretKey = config.vnp_HashSecret;
  let vnpUrl = config.vnp_Url;
  
  // Tạo mã giao dịch duy nhất
  const txnRef = `${orderId.substring(orderId.length - 8)}_${Date.now()}`;
  console.log('Generated transaction reference:', txnRef);
  
  // Tạo params
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

  // Sort các tham số
  vnp_Params = sortObject(vnp_Params);
  console.log('Sorted params before signing:', vnp_Params);
  
  // Tạo chuỗi hash
  const signData = querystring.stringify(vnp_Params, { encode: false });
  console.log('Sign data:', signData);
  
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  console.log('Generated signature:', signed);
  
  // Thêm chữ ký
  vnp_Params['vnp_SecureHash'] = signed;
  
  // Tạo URL
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
  console.log('Final payment URL:', vnpUrl);
  
  return vnpUrl;
};

export const verifyNewReturnUrl = (vnpParams) => {
  console.log('Verifying VNPay return with params:', vnpParams);
  
  const secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];
  
  let vnpParamsCopy = sortObject(vnpParams);
  console.log('Sorted params for verification:', vnpParamsCopy);
  
  const secretKey = config.vnp_HashSecret;
  const signData = querystring.stringify(vnpParamsCopy, { encode: false });
  console.log('Sign data for verification:', signData);
  
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  console.log('Generated signature:', signed);
  console.log('Original signature:', secureHash);
  
  const isValid = secureHash === signed;
  console.log('Signature is valid:', isValid);
  
  return isValid;
}; 