// Utility function for handling QR code operations

/**
 * Scan and decode QR code content
 * @param {string} qrCode - QR code content to decode
 * @returns {Promise<Object|null>} Decoded QR data or null if invalid
 */
export const scanQRCode = async (qrCode) => {
  try {
    // In a real application, this would use a QR code scanning library
    // For now, we'll implement a simple version that assumes the QR code
    // is formatted as JSON string with orderId field
    
    let orderData = null;
    
    // Check if the QR code is a valid string
    if (typeof qrCode !== 'string' || !qrCode.trim()) {
      return null;
    }
    
    // Try to parse the QR code content
    try {
      // If it's a JSON string
      orderData = JSON.parse(qrCode);
    } catch (e) {
      // If it's not JSON, try to extract orderId from the string
      // Assume format is something like "ORD-XXXXX" or similar
      const matches = qrCode.match(/ORD-\d{6}-\d{4}/);
      if (matches && matches[0]) {
        orderData = { orderId: matches[0] };
      }
    }
    
    // Validate that we have the required orderId
    if (!orderData || !orderData.orderId) {
      return null;
    }
    
    return orderData;
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return null;
  }
}; 