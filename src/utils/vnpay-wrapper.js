import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(timezone);
export const getVNPay = async () => {
  try {
    const vnpayModule = await import('vnpay');
    return vnpayModule;
  } catch (error) {
    console.error('Error importing VNPay:', error);
    throw error;
  }
}; 