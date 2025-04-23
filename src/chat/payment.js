const axios = require('axios');
require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

async function initializePayment(userSession, deviceId) {
  try {
    // Create payment request
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: userSession.orderTotal * 100, // Amount in kobo because Paystack uses kobo
        email: "adeoyeokeowo@gmail.com", 
        reference: `order-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        callback_url: `/api/payment/callback?deviceId=${deviceId}`,
        metadata: {
          deviceId,
          orderItems: userSession.currentOrder.map(item => ({
            name: item.name,
            quantity: item.quantity
          }))
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      message: 'Redirecting to payment...', 
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
      amount: userSession.orderTotal * 100,  // Include the amount explicitly
      publicKey: PAYSTACK_PUBLIC_KEY 
    };
  } catch (error) {
    console.error('PayStack initialization error:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Payment initialization failed',
      error: 'Payment initialization failed'
    };
  }
}

async function verifyPayment(reference) {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    
    return {
      success: false,
      error: 'Payment verification failed'
    };
  }
}

module.exports = {
  initializePayment,
  verifyPayment,
  PAYSTACK_PUBLIC_KEY
};
