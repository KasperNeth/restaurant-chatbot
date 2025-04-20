const chat = require("../../chat/chatbot"); 

function processMessage(req, res) {
try {
  const { deviceId, message } = req.body;

  if (!deviceId || !message) {
    return res.status(400).json({
      success: false,
      message: 'Device ID and message are required',
    });
  }

  const response = chat.processMessage(deviceId, message);
  res.json({ success: true, response });
} catch (error) {
  console.error('Error processing message:', error);
  res.status(500).json({
    success: false,
    message: 'Error processing your message',
  });
}
}

function startChat(req, res) {
try {
  // Extract device ID from query params or headers
  const deviceId = req.query.deviceId || req.headers['x-device-id'];

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: 'Device ID is required',
    });
  }

  const response = chat.getMainMenuResponse();
  res.json({ success: true, response });
} catch (error) {
  console.error('Error starting chat:', error);
  res.status(500).json({
    success: false,
    message: 'Error starting chat session',
  });
}
}

module.exports = {
processMessage,
startChat,
};