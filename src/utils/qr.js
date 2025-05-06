/**
 * Scan and decode QR code content
 * @param {string} qrCode - QR code content to decode
 * @returns {Promise<Object|null>} Decoded QR data or null if invalid
 */
export const scanQRCode = async (qrCode) => {
  try {
    let orderData = null;
    
    if (typeof qrCode !== 'string' || !qrCode.trim()) {
      return null;
    }
    
    try {
      orderData = JSON.parse(qrCode);
    } catch {
      const matches = qrCode.match(/ORD-\d{6}-\d{4}/);
      if (matches && matches[0]) {
        orderData = { orderId: matches[0] };
      }
    }
    
    if (!orderData || !orderData.orderId) {
      return null;
    }
    
    return orderData;
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return null;
  }
}; 