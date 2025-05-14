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
    const { amount, orderInfo, returnUrl, ipAddr } = req.body;

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
      vnp_Amount: Number(amount) * 100,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: returnUrl || "http://localhost:5000/api/vnpay/check-payment-vnpay",
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(tomorrow),
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr || req.ip,
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
      // Payment successful - this is the client-side return.
      // You might want to redirect the user to a success/failure page on your frontend
      // or display a message. The actual order update should be handled by IPN.
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

/**
 * Handle IPN (Instant Payment Notification) from VNPay
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const handleIPN = async (req, res) => {
  try {
    const vnpayParams = req.query;
    const secureHash = vnpayParams['vnp_SecureHash'];

    // Verify IPN response
    // The vnpay library's verifyReturnUrl might be suitable if it handles checksum correctly
    // according to VNPAY IPN guidelines (removing secureHash and secureHashType before signing).
    // If not, you might need custom verification logic here.
    const verifyResult = vnpayInstance.verifyReturnUrl(vnpayParams);

    if (verifyResult.isSuccess) {
      const vnp_ResponseCode = vnpayParams['vnp_ResponseCode'];
      const vnp_TxnRef = vnpayParams['vnp_TxnRef']; // Merchant's order ID

      // Check if the transaction was successful
      if (vnp_ResponseCode === '00') {
        // TODO: Implement your business logic here
        // 1. Check if vnp_TxnRef exists in your database.
        // 2. Check if the order status is already updated (to prevent duplicate updates).
        // 3. Verify amount if necessary.
        // 4. Update order status to 'paid' or 'completed'.
        console.log(`IPN: Payment successful for order ${vnp_TxnRef}. Updating database...`);
        // Respond to VNPAY to acknowledge receipt
        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      } else {
        // Payment was not successful (e.g., cancelled, failed)
        // TODO: Log this event, potentially update order status to 'failed' or 'cancelled'
        console.log(`IPN: Payment not successful for order ${vnp_TxnRef}. ResponseCode: ${vnp_ResponseCode}`);
        return res.status(200).json({ RspCode: vnp_ResponseCode, Message: 'Transaction failed or cancelled' });
      }
    } else {
      // Checksum verification failed
      console.log('IPN: Checksum failed.');
      return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    // According to VNPAY docs, if there's an error processing IPN,
    // VNPAY might retry. Avoid sending 500 if possible, instead send a VNPAY RspCode.
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
}; 