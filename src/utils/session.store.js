let sessions = {};

function getSession(deviceId) {
  // Create a new session if none exists
  if (!sessions[deviceId]) {
    sessions[deviceId] = {
      currentOrder: [],
      orderHistory: [],
      currentState: "MAIN_MENU",
      orderTotal: 0,
      lastInteraction: Date.now(),
      scheduledOrders: [],
      tempSelectedItem: null
    };
  } else {
    // Update last interaction time
    sessions[deviceId].lastInteraction = Date.now();
  }
  
  return sessions[deviceId];
}

function updateSession(deviceId, updates) {
  // Ensure session exists
  if (!sessions[deviceId]) {
    getSession(deviceId);
  }
  
  // Update session with new data
  Object.assign(sessions[deviceId], updates, {
    lastInteraction: Date.now()
  });
  
  return sessions[deviceId];
}

function addToOrder(deviceId, menuId, quantity, menuItem) {
  const session = getSession(deviceId);
  const itemTotal = menuItem.price * quantity;
  
  // Create order item
  const orderItem = {
    menuId,
    name: menuItem.name,
    price: menuItem.price,
    quantity,
    total: itemTotal
  };
  
  // Add to current order
  session.currentOrder.push(orderItem);
  session.orderTotal += itemTotal;
  
  return updateSession(deviceId, { 
    currentOrder: session.currentOrder,
    orderTotal: session.orderTotal
  });
}

function cancelOrder(deviceId) {
  return updateSession(deviceId, {
    currentOrder: [],
    orderTotal: 0
  });
}

function completeOrder(deviceId, paymentReference) {
  const session = getSession(deviceId);
  
  // Create completed order record
  const completedOrder = {
    orderId: generateOrderId(),
    items: [...session.currentOrder],
    total: session.orderTotal,
    date: new Date(),
    paymentReference
  };
  
  // Add to history and clear current
  const orderHistory = [...session.orderHistory, completedOrder];
  
  return updateSession(deviceId, {
    orderHistory,
    currentOrder: [],
    orderTotal: 0,
    currentState: "MAIN_MENU"
  });
}

function scheduleOrder(deviceId, scheduledTime) {
  const session = getSession(deviceId);
  
  // Create scheduled order
  const scheduledOrder = {
    orderId: generateOrderId(),
    items: [...session.currentOrder],
    total: session.orderTotal,
    scheduledFor: scheduledTime,
    created: new Date()
  };
  
  // Add to scheduled orders and clear current
  const scheduledOrders = [...session.scheduledOrders, scheduledOrder];
  
  return updateSession(deviceId, {
    scheduledOrders,
    currentOrder: [],
    orderTotal: 0,
    currentState: "MAIN_MENU"
  });
}

function formatCurrentOrder(deviceId) {
  const session = getSession(deviceId);
  
  if (session.currentOrder.length === 0) {
    return "Your current order is empty.";
  }
  
  let result = "Your current order:\n";
  
  session.currentOrder.forEach((item, index) => {
    result += `${index + 1}. ${item.quantity}× ${item.name} - ₦${item.total}\n`;
  });
  
  result += `\nTotal: ₦${session.orderTotal}`;
  return result;
}

function formatOrderHistory(deviceId) {
  const session = getSession(deviceId);
  
  if (session.orderHistory.length === 0) {
    return "You have no order history yet.";
  }
  
  let result = "Your order history:\n\n";
  
  session.orderHistory.forEach((order) => {
    result += `Order #${order.orderId} (${order.date.toLocaleDateString()}):\n`;
    
    order.items.forEach(item => {
      result += `- ${item.quantity}× ${item.name} - ₦${item.total}\n`;
    });
    
    result += `Total: ₦${order.total}\n\n`;
  });
  
  return result;
}

function generateOrderId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredSessions(expiryTimeMs = 30 * 60 * 1000) {
  const now = Date.now();
  
  Object.keys(sessions).forEach(deviceId => {
    if (now - sessions[deviceId].lastInteraction > expiryTimeMs) {
      delete sessions[deviceId];
    }
  });
}

module.exports = {
  getSession,
  updateSession,
  addToOrder,
  cancelOrder,
  completeOrder,
  scheduleOrder,
  formatCurrentOrder,
  formatOrderHistory,
  cleanExpiredSessions,
  generateOrderId
};
