document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const quickOptions = document.getElementById('quickOptions');

    // Simulate loading time (you can adjust this as needed)
    setTimeout(function() {
    // Hide loading screen and show main content
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    mainContent.style.opacity = '1';
    mainContent.style.visibility = 'visible';

    // Initialize chat after loading screen has completed
    initializeChat();
    }, 2500); // 2.5 seconds loading time

    // Get or generate device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
    deviceId = 'device-' + Math.floor(Math.random() * 1000000000);
    localStorage.setItem('deviceId', deviceId);
    }

    function initializeChat() {
    // Initialize chat
    startChat();

    // Check if redirected from payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
        setTimeout(() => {
            addMessage('Thank you! Your payment was successful and your order has been placed.', 'bot');
        }, 1000);
    } else if (paymentStatus === 'failed') {
        setTimeout(() => {
            addMessage('Unfortunately, there was an issue with your payment. Please try again.', 'bot');
        }, 1000);
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    }

// Functions
function startChat() {
// Use full URLs for API calls
fetch(`/api/chat/start?deviceId=${deviceId}`)
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    if (data.success) {
        addMessage(data.response.message, 'bot');
        displayOptions(data.response.options);
    } else {
        throw new Error(data.message || 'Unknown error');
    }
})
.catch(error => {
    console.error('Error starting chat:', error);
    addMessage('Sorry, there was an error connecting to the chat service.', 'bot');
});
}

function sendMessage() {
const message = userInput.value.trim();
if (message === '') return;

// Add user message to chat with "you" label
addMessage(message, 'user');
userInput.value = '';

// Clear quick options
quickOptions.innerHTML = '';

// Send message to server
fetch('/api/chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ deviceId, message })
})
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    if (data.success) {
        // Check if this is a payment response
        if (data.response.paymentUrl) {
            // Display a message before proceeding with payment
            addMessage(data.response.message || 'Please complete your payment to place your order.', 'bot');
            
            // Then handle the payment process
            setTimeout(() => {
                handlePayment(data.response);
            }, 500);
        } else {
            // Regular message response
            addMessage(data.response.message, 'bot');
            displayOptions(data.response.options);
        }
    } else {
        throw new Error(data.message || 'Unknown error');
    }
})
.catch(error => {
    console.error('Error sending message:', error);
    addMessage('Sorry, there was an error processing your message.', 'bot');
});
}

function addMessage(text, sender) {
// Safety check to ensure text is not undefined
if (text === undefined || text === null) {
    text = 'No message content';
    console.warn('Attempted to add undefined message');
}

const messageDiv = document.createElement('div');
messageDiv.className = `message ${sender}-message clearfix`;

// Create a container for the entire message group
const messageContainer = document.createElement('div');
messageContainer.className = 'message-container';

if (sender === 'user') {
    // Add "you" label for user messages
    const userLabel = document.createElement('div');
    userLabel.className = 'user-label';
    userLabel.textContent = 'You';
    messageDiv.appendChild(userLabel);
    
    // Add content in a separate div
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text.toString().replace(/\n/g, '<br>');
    messageDiv.appendChild(contentDiv);
} else {
    // For bot messages
    messageDiv.innerHTML = text.toString().replace(/\n/g, '<br>');
}

// Add timestamp inside the message container
const timeSpan = document.createElement('span');
timeSpan.className = `message-time ${sender}-time`;
timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Append message and timestamp to container
messageContainer.appendChild(messageDiv);
messageContainer.appendChild(timeSpan);

// Add container to chat
chatMessages.appendChild(messageContainer);

// Scroll to bottom
chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayOptions(options) {
if (!options || options.length === 0) return;

quickOptions.innerHTML = '';

options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'option-button';
    button.textContent = option;
    button.addEventListener('click', function() {
    const match = option.match(/^(\d+)/);
    if (match && [0, 1, 97, 98, 99].includes(parseInt(match[1], 10))) {
        userInput.value = match[1]; // Use the numeric option directly
    } else {
        // For regular menu items, keep extracting numeric option
        const numericOption = option.match(/^\d+/);
        userInput.value = numericOption ? numericOption[0] : option;
    }
    sendMessage();
});

quickOptions.appendChild(button);
});
}

function handlePayment(paymentData) {
// Payment data validation with detailed logging
console.log("Payment data received:", paymentData);

if (!paymentData) {
    console.error("Payment data is completely missing");
    addMessage('Error: Payment information is missing. Please try again later.', 'bot');
    return;
}

if (!paymentData.paymentUrl && !paymentData.publicKey) {
console.error("Both paymentUrl and publicKey are missing:", paymentData);
addMessage('Error: Payment information is incomplete. Please try again later.', 'bot');
return;
}

// Use PayStack inline
if (window.PaystackPop && paymentData.publicKey) {
try {
// Ensure we have a valid amount - default to 0 if not available
const amount = (paymentData.amount && !isNaN(paymentData.amount)) ? 
                paymentData.amount : 0;
                

const handler = PaystackPop.setup({
    key: paymentData.publicKey,
    email: 'adeoyeokeowo@gmail.com', 
    amount: amount,
    currency: 'NGN',
    ref: paymentData.reference || 'no-reference',
    callback: function() {
        window.location.href = '/?payment=success';
    },
    onClose: function() {
        addMessage('Payment window closed. Your order is not confirmed yet.', 'bot');
    }
});
    
    // Make sure openIframe is available
    if (typeof handler.openIframe === 'function') {
        handler.openIframe();
    } else {
        console.error("PayStack handler.openIframe is not a function");
        throw new Error("PayStack initialization error");
    }
    } catch (error) {
        console.error('PayStack error:', error);
        addMessage('There was an error with the payment system. Please try again later.', 'bot');
    }
} else if (paymentData.paymentUrl) {
    // Redirect to payment URL as fallback
    addMessage('Redirecting to payment page...', 'bot');
    setTimeout(() => {
        window.location.href = paymentData.paymentUrl;
    }, 1000);
} else {
    // No payment method available
    console.error("No viable payment method found in data:", paymentData);
    addMessage('Sorry, payment processing is currently unavailable. Please try again later.', 'bot');
}
}
}); 