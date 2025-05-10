import crypto from 'crypto';
import querystring from 'qs';
import moment from 'moment';

// VNPay configuration
const config = {
  vnp_TmnCode: "OZE53A0G",
  vnp_HashSecret: "U89C185M60347VMKQOUWBJSGOXIVOSBA",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: "http://localhost:3008/api/vnpay/check-payment-vnpay"
};

/**
 * Sort object by key (alphabetical order)
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== null && obj[key] !== undefined) {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}

/**
 * Format date according to VNPay requirements (YYYYMMDDHHmmss)
 * 
 * @param {Date} date Date to format
 * @returns {String} Formatted date string
 */
export const dateFormat = (date) => {
  return moment(date).format('YYYYMMDDHHmmss');
};

/**
 * Create QR code payment URL for VNPay
 * 
 * @param {Object} params Payment parameters
 * @returns {Object} VNPay response with URL and QR data
 */
export const createQrPayment = (params) => {
  try {
    const {
      vnp_Amount,
      vnp_IpAddr,
      vnp_TxnRef,
      vnp_OrderInfo,
      vnp_OrderType = 'other',
      vnp_Locale = 'vn',
      vnp_ReturnUrl = config.vnp_ReturnUrl,
      vnp_CreateDate = dateFormat(new Date()),
      vnp_ExpireDate
    } = params;

    // Create date formats
    const tmnCode = config.vnp_TmnCode;
    const secretKey = config.vnp_HashSecret;
    const vnpUrl = config.vnp_Url;
    
    // Payment parameters
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: vnp_Locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: vnp_TxnRef,
      vnp_OrderInfo: vnp_OrderInfo,
      vnp_OrderType: vnp_OrderType,
      vnp_Amount: parseInt(vnp_Amount) * 100, // Convert to smallest currency unit
      vnp_ReturnUrl: vnp_ReturnUrl,
      vnp_IpAddr: vnp_IpAddr,
      vnp_CreateDate: vnp_CreateDate
    };

    // Add expiration date if provided
    if (vnp_ExpireDate) {
      vnp_Params.vnp_ExpireDate = vnp_ExpireDate;
    }

    // Sort parameters alphabetically
    vnp_Params = sortObject(vnp_Params);
    
    // Create signature with SHA512 (changed from previous implementation)
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Add signature to request
    vnp_Params['vnp_SecureHash'] = signed;
    
    // Create complete URL - using 'encode: true' to properly encode the URL parameters
    const paymentUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: true });
    
    return {
      code: '00',
      message: 'success',
      data: {
        paymentUrl: paymentUrl
      }
    };
  } catch (error) {
    console.error('Error creating VNPay QR payment:', error);
    return {
      code: '99',
      message: 'Error creating payment',
      data: null
    };
  }
};

/**
 * Verify the payment callback from VNPay
 * 
 * @param {Object} vnpParams VNPay callback parameters
 * @returns {Boolean} Whether the signature is valid
 */
export const verifyPaymentReturn = (vnpParams) => {
  try {
    const secureHash = vnpParams['vnp_SecureHash'];
    
    // Remove hash from params before verification
    const paramsCopy = { ...vnpParams };
    delete paramsCopy['vnp_SecureHash'];
    delete paramsCopy['vnp_SecureHashType'];
    
    // Sort the parameters
    const sortedParams = sortObject(paramsCopy);
    
    // Create signature
    const secretKey = config.vnp_HashSecret;
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
    // Compare signatures
    return secureHash === signed;
  } catch (error) {
    console.error('Error verifying VNPay callback:', error);
    return false;
  }
};

// Export constants for use in other files
export const VnpLocale = {
  VN: 'vn',
  EN: 'en'
};

export const ProductCode = {
  Topup: 'topup',
  BillPayment: 'billpayment',
  FeeShipping: 'feeshipping',
  Other: 'other'
}; 