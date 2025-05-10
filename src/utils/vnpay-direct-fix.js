
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';

// Extend dayjs with timezone plugin
dayjs.extend(timezone);

// Prepare custom import meta
const customMeta = {
  ...import.meta,
  resolve: (specifier) => {
    // Replace the problematic import
    if (specifier === 'dayjs/plugin/timezone') {
      return import.meta.url.replace('vnpay-direct-fix.js', 'dayjs-alias.js');
    }
    return specifier;
  }
};

/**
 * Get a patched version of VNPay
 */
export async function getVNPayFixed() {
  try {
    // Load VNPay only after dayjs has been set up
    const vnpay = await import('vnpay');
    
    // Create VNPay instance with our configured options
    const createVNPayInstance = (config) => {
      return new vnpay.VNPay({
        tmnCode: config.tmnCode || "LXS5R4EG",
        secureSecret: config.secureSecret || 'E9ZVT6V5D1XF2APNOJP7UBWU91VHGWG7',
        vnpayHost: config.vnpayHost || 'https://sandbox.vnpayment.vn',
        testMode: config.testMode !== undefined ? config.testMode : true,
        hashAlgorithm: config.hashAlgorithm || 'SHA512',
        LoggerFn: config.LoggerFn || vnpay.ignoreLogger
      });
    };

    return {
      ...vnpay,
      createVNPayInstance,
      dayjs
    };
  } catch (error) {
    console.error('Failed to load VNPay:', error);
    throw error;
  }
} 