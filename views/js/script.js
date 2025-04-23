document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const quickOptions = document.getElementById('quickOptions');


    setTimeout(function() {
        // Hide loading screen and show main content
    loadingScreen.style.opacity = '0';
    loadingScreen.style.visibility = 'hidden';
    mainContent.style.opacity = '1';
    mainContent.style.visibility = 'visible';

        // Initialize chat after loading screen has completed
        initializeChat();
    }, 1500); //1.5 seconds loadinG screen

    // Get or generate device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Math.floor(Math.random() * 1000000000);
        localStorage.setItem('deviceId', deviceId);
    }

    function initializeChat() {
        // Check if redirected from payment first
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        const paymentRef = urlParams.get('ref');

if (paymentStatus === 'success') {
    setTimeout(() => {
        if (paymentRef) {
            // Make an explicit call to ensure the payment is processed
            fetch(`/api/payment/callback?deviceId=${deviceId}&reference=${paymentRef}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-id': deviceId
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log("Payment completion verified:", data);
            })
                    .catch(err => {
                        console.error("Error verifying payment completion:", err);
                    });
                }
                
                addMessage('Thank you! Your payment was successful and your order has been placed.', 'bot');
                displayOptions(getMainMenuOptions());
            }, 1000);
    } else if (paymentStatus === 'failed') {
        setTimeout(() => {
            addMessage('Unfortunately, there was an issue with your payment. Please try again.', 'bot');
            displayOptions(getMainMenuOptions());
        }, 1000);
    }else{
        // Initialize chat
        startChat();

    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    }

    //Helper function to get main menu options directly in the frontend
// instead of having to make an API call just to get the options after payment
function getMainMenuOptions() {
    return [
        '1 - Place an order',
        '98 - See order history',
        '97 - See current order',
        '96 - Schedule an order',
        '0 - Cancel order',
    ];
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
.catch(err => {
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
    
    if (!data.success) {
    throw new Error(data.message || 'Error in response');
    }

    // Extract the actual response object from the data
    let responseObj = data.response;

    if (responseObj && responseObj.response) {
    responseObj = responseObj.response;
    }

    // Now check if this is a payment response
    if (responseObj && responseObj.paymentUrl) {
    // Add message first
    if (responseObj.message) {
        addMessage(responseObj.message, 'bot');
    }
        // Add payment URL message
            // Process payment with slight delay
            setTimeout(() => {
              handlePayment(responseObj);
        }, 100);//
        } else {
// Regular message response
    if (responseObj && responseObj.message) {
        addMessage(responseObj.message, 'bot');
    } else if (data.message) {
        addMessage(data.message, 'bot');
    } else {
        addMessage('Response received.', 'bot');
    }
    
    // Display options if available
    if (responseObj && responseObj.options) {
        displayOptions(responseObj.options);
    }
    }
})
.catch(err => {
    addMessage('Sorry, there was an error processing your message.', 'bot');
});
}

function addMessage(text, sender) {
if (text === undefined || text === null) {
    text = 'No message content';
    console.warn('Attempted to add undefined message');
}

const messageDiv = document.createElement('div');
messageDiv.className = `message ${sender}-message clearfix`;

const messageContainer = document.createElement('div');
messageContainer.className = 'message-container';

if (sender === 'user') {
    const userLabel = document.createElement('div');
    userLabel.className = 'user-label';
    userLabel.textContent = 'You';
    messageDiv.appendChild(userLabel);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text.replace(/\n/g, '<br>');
    messageDiv.appendChild(contentDiv);
    } else {
    // For bot messages - allow HTML for links and buttons
messageDiv.innerHTML = text;
}

const timeSpan = document.createElement('span');
timeSpan.className = `message-time ${sender}-time`;
timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

messageContainer.appendChild(messageDiv);
messageContainer.appendChild(timeSpan);

chatMessages.appendChild(messageContainer);
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
    // First add a clear message to notify the user
    addMessage('Initializing payment process...', 'bot');
    
    // Make sure we have all required fields
    if (!paymentData || !paymentData.publicKey || !paymentData.reference || !paymentData.paymentUrl) {
        addMessage('Payment information is incomplete. Please try again or contact support.', 'bot');
        return;
}

    // Added payment button interface for better frontend experience
    //it is a simple button that will open the payment gateway in an iframe
setTimeout(() => {
    const paymentButtonHtml = `
        <div style="text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 10px; margin: 10px 0;">
            <p style="margin-bottom: 10px;">Your order total: ₦${(paymentData.amount/100).toLocaleString()}</p>
            <button id="paystackButton" style="background: linear-gradient(135deg, #333 0%, #60ad5e 100%); color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold;">Pay Now</button>
            <p style="margin-top: 10px; font-size: 0.8rem;">
                Or <a href="${paymentData.paymentUrl}" target="_blank" style="color: #4e6cef;">click here</a> to pay directly
            </p>
             <p style="margin-top: 5px; font-size: 0.8rem;">
                    Reference: ${paymentData.reference}
                </p>
        </div>
    `;
    
    addMessage(paymentButtonHtml, 'bot');
    
    // Add click event to the payment button
    setTimeout(() => {
        const paystackButton = document.getElementById('paystackButton');
        const directPaymentLink = document.getElementById('directPaymentLink');
        
        if (paystackButton) {
            paystackButton.addEventListener('click', function() {
                initializePaystackPopup(paymentData);
            });
        }
        
        if (directPaymentLink) {
            directPaymentLink.addEventListener('click', function() {
                // Use the same handler but with a flag to indicate direct payment
                localStorage.setItem('paymentMethod', 'direct');
                // Open the payment URL in a new tab
                window.open(paymentData.paymentUrl, '_blank');
                // Display message to user
                addMessage('Payment page opened in a new tab. Please complete your payment there.', 'bot');
            });
        }
    }, 100);
}, 1000);
}
function initializePaystackPopup(paymentData) {
    try {
// Check if PaystackPop is available
        if (typeof PaystackPop === 'undefined') {
            addMessage('Payment system is not available. Please use the direct payment link.', 'bot');
            return;
        }

    addMessage('Opening payment gateway...', 'bot');

const handler = PaystackPop.setup({
    key: paymentData.publicKey,
    email: paymentData.email || "adeoyeokeowo@gmail.com",
    amount: paymentData.amount,
    currency: 'NGN',
    ref: paymentData.reference,
    callback: function() {
        // Save reference to localStorage to help with state persistence
        localStorage.setItem('lastPaymentReference', paymentData.reference);
        addMessage('Payment successful! Processing your order...', 'bot');
        window.location.href = '/?payment=success';
    },
    onClose: function() {
        addMessage('Payment window closed. Your order is not confirmed yet.', 'bot');
    }
});

        // Open the iframe
        handler.openIframe();
    } catch (error) {
        addMessage(`Payment initialization failed. Please <a href="${paymentData.paymentUrl}" target="_blank">click here to pay directly</a>.`, 'bot');
}
  }   
});