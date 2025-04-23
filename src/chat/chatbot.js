const menu = require("./menu.js");
const session = require("../utils/session.store.js"); 
const payment = require('./payment.js'); 

// Process user input message
function processMessage(deviceId, userInput) {
// Get current session
const userSession = session.getSession(deviceId);
const state = userSession.currentState;

// Handle special commands no matter what state we're in
if (typeof userInput === 'string') {
  if (/^99$/.test(userInput.trim()) || userInput === 99) {
    // Checkout order - always handle via main menu logic
    return handleMainMenu(deviceId, 99, true);
  } 
  else if (/^98$/.test(userInput.trim()) || userInput === 98) {
    // See order history - always handle via main menu logic
    return handleMainMenu(deviceId, 98, true);
  }
  else if (/^97$/.test(userInput.trim()) || userInput === 97) {
    // See current order - always handle via main menu logic
    return handleMainMenu(deviceId, 97, true);
  }
  else if (/^96$/.test(userInput.trim()) || userInput === 96) {
    // See current order - always handle via main menu logic
    return handleMainMenu(deviceId, 96, true);
  }
  else if (/^0$/.test(userInput.trim()) || userInput === 0) {
    // Cancel order - always handle via main menu logic
    return handleMainMenu(deviceId, 0, true);
  }
}

// Normal number parsing for other inputs
let numericInput = NaN;
let isValidNumber = false;

if (typeof userInput === 'string') {
  // Check if it's purely a number
  if (/^\d+$/.test(userInput.trim())) {
    numericInput = parseInt(userInput.trim(), 10);
    isValidNumber = !isNaN(numericInput);
  }
} else if (typeof userInput === 'number') {
  numericInput = userInput;
  isValidNumber = true;
}

// Process based on current state
switch (state) {
  case 'MAIN_MENU':
    return handleMainMenu(deviceId, userInput, isValidNumber);

  case 'PLACING_ORDER':
    // Special case for option 1 when already in placing order
    if (numericInput === 1 && isValidNumber) {
      return handleMainMenu(deviceId, 1, true);
    }
    return handlePlacingOrder(deviceId, numericInput, isValidNumber);

  case 'QUANTITY_SELECTION':
    return handleQuantitySelection(deviceId, numericInput, isValidNumber);

  case 'PAYMENT_CONFIRMATION':
    return handlePaymentConfirmation(deviceId, userInput);

  case 'SCHEDULING_ORDER':
    return handleScheduling(deviceId, userInput);

  default:
    // Reset to main menu if state is unknown
    session.updateSession(deviceId, { currentState: 'MAIN_MENU' });
    return getMainMenuResponse();
}
}

// Handle main menu options
function handleMainMenu(deviceId, option,) {
const userSession = session.getSession(deviceId);

// Handle special options first - regardless of type
if (option === 99 || option === '99') {
  // Checkout order
  if (userSession.currentOrder.length === 0) {
    return createResponse(
      'No order to place. Would you like to place a new order?',
      getMainMenuOptions()
    );
  }

  session.updateSession(deviceId, { currentState: 'PAYMENT_CONFIRMATION' });
  return createResponse(
    `Your order total is ₦${userSession.orderTotal}. Would you like to proceed to payment?`,
    ['Yes', 'No (Return to main menu)']
  );
} 
//add scheduling option button to main menu
if (option === 96 || option === '96') {
  // Check if they have items in their order first
  if (userSession.currentOrder.length === 0) {
    return createResponse(
      'You need to add items to your order before scheduling. Would you like to place an order first?',
      ['1 - Place an order', 'Return to main menu']
    );
  }
  
  // Move to scheduling state
  session.updateSession(deviceId, { currentState: 'SCHEDULING_ORDER' });
  return createResponse(
    'When would you like your order to be ready? Please enter a date and time in the format YYYY-MM-DD HH:MM',
    ['Example: 2025-04-25 18:30', 'Cancel (Return to main menu)']
  );
}


else if (option === 98 || option === '98') {
  // See order history
  return createResponse(
    session.formatOrderHistory(deviceId),
    getMainMenuOptions()
  );
}
else if (option === 97 || option === '97') {
  // See current order
  return createResponse(
    session.formatCurrentOrder(deviceId),
    getMainMenuOptions()
  );
}
else if (option === 0 || option === '0') {
  // Cancel order
  if (userSession.currentOrder.length === 0) {
    return createResponse(
      'You have no current order to cancel.',
      getMainMenuOptions()
    );
  }

  // Reset the current order
  session.cancelOrder(deviceId);

  return createResponse(
    'Your order has been canceled.',
    getMainMenuOptions()
  );
}
else if (option === 1 || option === '1') {
  // Place an order
  session.updateSession(deviceId, { currentState: 'PLACING_ORDER' });
  return createResponse(
    "Here's our menu. Please select an item by entering its number:",
    getMenuOptions()
  );
}
else {
  // Default - invalid option
  return createResponse(
    'Invalid option. Please try again.',
    getMainMenuOptions()
  );
}
}

// Handle menu item selection
function handlePlacingOrder(deviceId, menuId, isValidNumber) {
if (!isValidNumber || !menu.getMenuItem(menuId)) {
  return createResponse(
    'Please select a valid menu item number.',
    getMenuOptions()
  );
}

// Store the currently selected item ID for quantity selection
session.updateSession(deviceId, {
  tempSelectedItem: menuId,
  currentState: 'QUANTITY_SELECTION',
});

const item = menu.getMenuItem(menuId);

return createResponse(
  `You selected ${item.name} (₦${item.price}). How many would you like to order?`,
  ['Enter a number (1-10)']
);
}

// Handle quantity selection for menu items
function handleQuantitySelection(deviceId, quantity, isValidNumber) {
if (!isValidNumber || quantity < 1 || quantity > 10) {
  return createResponse('Please enter a valid quantity between 1 and 10.', [
    'Enter a number (1-10)',
  ]);
}

const userSession = session.getSession(deviceId);
const menuId = userSession.tempSelectedItem;
const item = menu.getMenuItem(menuId);

// Add item to current order
session.addToOrder(deviceId, menuId, quantity, item);

// Update state
session.updateSession(deviceId, { currentState: 'PLACING_ORDER' });

// Get updated session after adding item
const updatedSession = session.getSession(deviceId);

return createResponse(
  `Added ${quantity} × ${item.name} to your order. Your current total is ₦${updatedSession.orderTotal}. Would you like to order anything else?`,
  [
    ...getMenuOptions(),
    '99 - Proceed to checkout',
    '97 - View current order',
    '96 - Schedule an order', 
    '0 - Cancel order',
  ]
);
}

// Handle payment confirmation
async function handlePaymentConfirmation(deviceId, response) {
  if (response.toLowerCase() === 'yes') {
    const userSession = session.getSession(deviceId);

  try {
    // Initialize payment with Paystack
    const paymentInit = await payment.initializePayment(userSession, deviceId);

    if (!paymentInit.success) {
      session.updateSession(deviceId, { currentState: 'MAIN_MENU' });
      return createResponse(
        'Sorry, there was an issue initializing payment. Please try again.',
        getMainMenuOptions()
      );
    }

    //Return a properly structured response object
    return {
      success: true,
      response: {
        message: 'Please complete your payment to place your order.',
        paymentUrl: paymentInit.authorizationUrl,
        reference: paymentInit.reference,
        publicKey: paymentInit.publicKey,
        amount: userSession.orderTotal * 100,
        timestamp: new Date().toISOString()
      },
    };
  } catch (error) {

    session.updateSession(deviceId, { currentState: 'MAIN_MENU' });
    return createResponse(
      'Sorry, there was an issue with payment. Please try again later.',
    getMainMenuOptions()
  );
}
} else {
  session.updateSession(deviceId, { currentState: 'MAIN_MENU' });

  return createResponse(
    'Payment canceled. Returning to main menu.',
    getMainMenuOptions()
  );
}
}

// Handle payment callback from Paystack
async function handlePaymentCallback(deviceId, reference, status) {
    if (status !== 'success') {
      session.updateSession(deviceId, { currentState: 'MAIN_MENU' });
      return createResponse(
        'Your payment was not successful. Please try again or choose another payment method.',
        getMainMenuOptions()
      );
    }

try {
  // Verify payment
  const verification = await payment.verifyPayment(reference);

  if (!verification.success) {
    session.updateSession(deviceId, { currentState: 'MAIN_MENU' });
    return createResponse(
      'We could not verify your payment. Please contact support with your reference: ' +
        reference,
      getMainMenuOptions()
    );
  }

  // Complete the order
  session.completeOrder(deviceId, reference);

  return createResponse(
    'Thank you! Your payment was successful and your order has been placed. Would you like to do anything else?',
    getMainMenuOptions()
  );
} catch (error) {
  console.error('Payment verification error:', error);
  session.updateSession(deviceId, { currentState: 'MAIN_MENU' });
  return createResponse(
    'There was an issue verifying your payment. Please contact support.',
    getMainMenuOptions()
  );
}
}

function handleScheduling(deviceId, dateTimeInput) {
// Validate date format and ensure it's in the future
const scheduledTime = new Date(dateTimeInput);
const now = new Date();

if (isNaN(scheduledTime) || scheduledTime <= now) {
  return createResponse(
    'Please enter a valid future date and time in format: YYYY-MM-DD HH:MM',
    ['Example: 2025-04-25 18:30']
  );
}

// Schedule the order
session.scheduleOrder(deviceId, scheduledTime);

return createResponse(
  `Your order has been scheduled for ${scheduledTime.toLocaleString()}. We'll prepare it for that time.`,
  getMainMenuOptions()
);
}

// Helper Functions
// Get main menu options
function getMainMenuOptions() {
return [
  '1 - Place an order',
  '96 - Schedule an order', 
  '99 - Checkout order',
  '98 - See order history',
  '97 - See current order',
  '0 - Cancel order',
];
}

// Get formatted menu options
function getMenuOptions() {
const menuItems = menu.getAllMenuItems();
const options = [];

Object.entries(menuItems).forEach(([id, item]) => {
  options.push(`${id} - ${item.name} (₦${item.price})`);
});

return options;
}

// Create a standard response object
function createResponse(message, options = []) {
return {
  message,
  options,
  timestamp: new Date().toISOString(),
};
}


// Get welcome message
function getMainMenuResponse() {
return createResponse(
  'Welcome to our restaurant chatbot! How can I help you today?',
  getMainMenuOptions()
);
}

module.exports = {
processMessage,
handlePaymentCallback,
getMainMenuResponse,
};
