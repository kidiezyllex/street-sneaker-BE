import vnpay, { dateFormat, ProductCode, VnpLocale } from '../utils/vnpay-fix.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize VNPay instance once
const vnpayInstance = new vnpay.VNPay({
  tmnCode: "LXS5R4EG",
  secureSecret: 'E9ZVT6V5D1XF2APNOJP7UBWU91VHGWG7',
  vnpayHost: 'https://sandbox.vnpayment.vn',
  testMode: true,
  hashAlgorithm: 'SHA512'
});

/**
 * Create QR payment URL using VNPay
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} VNPay payment URL and transaction info
 */
export const createQR = async (req, res) => {
  try {
    const { amount, orderInfo, returnUrl } = req.body;

    if (!amount || !orderInfo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: amount, orderInfo'
      });
    }

    // Generate transaction reference
    const txnRef = uuidv4().replace(/-/g, '').substring(0, 15);
    
    // Set expiration date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build VNPay payment URL
    const vnpayResponse = await vnpayInstance.buildPaymentUrl({
      vnp_Amount: Number(amount),
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl || "http://localhost:5000/api/vnpay/check-payment-vnpay",
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
    });

    return res.status(201).json({
      success: true,
      data: vnpayResponse,
      txnRef
    });
  } catch (error) {
    console.error('VNPay createQR error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Check payment status from VNPay callback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Payment verification result
 */
export const checkPayment = async (req, res) => {
  try {
    const vnpayParams = req.query;
    
    // Verify payment response
    const verifyResult = vnpayInstance.verifyReturnUrl(vnpayParams);

    if (verifyResult.isSuccess) {
      // Payment successful - implement your business logic here
      // e.g., update order status, save transaction details, etc.
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          transactionInfo: verifyResult,
          vnpayParams
        }
      });
    } else {
      // Payment failed or verification failed
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: verifyResult
      });
    }
  } catch (error) {
    console.error('VNPay checkPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 