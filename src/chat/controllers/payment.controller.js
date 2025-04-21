const chat = require("../../chat/chatbot");

async function handleCallback(req, res) {
  try {
    const { reference, trxref } = req.query;
    const deviceId = req.query.deviceId || req.headers['x-device-id'];

    if (!deviceId || !reference) {
      return res.redirect('/?payment=failed');
    }

    await chat.handlePaymentCallback(
      deviceId,
      reference,
      'success'
    );

    // Store success in query param instead of using session
    res.redirect('/?payment=success');
  } catch (error) {
    console.error('Error handling payment callback:', error);
    res.redirect('/?payment=failed');
  }
}

module.exports = {
  handleCallback,
};