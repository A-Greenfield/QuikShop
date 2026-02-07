let cart = [];

// 1. One-Tap Add to Cart Logic
function addToCart(name, price) {
    cart.push({ name, price });
    updateUI();
}

// 2. Refresh the UI (Total and Cart count)
function updateUI() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('total-price').innerText = total;
    
    const cartItemsDiv = document.getElementById('cart-items-list');
    cartItemsDiv.innerHTML = cart.map(item => `<li>${item.name} - $${item.price}</li>`).join('');
}

// 3. Paystack & Backend Handoff
function initiatePayment() {
    // Collect shipping info
    const shipping = {
        name: document.getElementById('cust-name').value,
        email: document.getElementById('cust-email').value,
        phone: document.getElementById('cust-phone').value,
        address: document.getElementById('cust-address').value
    };

    // Validation
    if (!shipping.email || !shipping.name || cart.length === 0) {
        alert("Please add items and fill in your details!");
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);

    const handler = PaystackPop.setup({
        key: 'pk_test_d578148ba7ddfbe62e6d5b1e1e9217549f8ac5c7', // REPLACE WITH YOUR ACTUAL KEY
        email: shipping.email,
        amount: total * 100, // Amount in cents/kobo
        currency: "USD",    // Change to "NGN" if using Naira
        callback: function(response) {
            // Trigger the Vercel Serverless Function
            fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reference: response.reference, 
                    cart: cart, 
                    shipping: shipping 
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // Redirect to success page
                    window.location.href = "success.html";
                } else {
                    alert("Payment verification failed. Please contact support.");
                }
            })
            .catch(err => console.error("Error calling API:", err));
        },
        onClose: function() {
            alert('Transaction was not completed.');
        }
    });
    handler.openIframe();
}
