document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    
    fetchCartSummary(token);

    const paymentForm = document.querySelector("#payment-form");
    paymentForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const selectedShippingOption = document.querySelector('input[name="shippingOption"]:checked');
        if (!selectedShippingOption) {
            alert("Please select a shipping option.");
            return;
        }

        const checkoutDetails = {
            shippingOption: selectedShippingOption.value
        };

        console.log('Submitting checkout with details:', checkoutDetails);

        fetch('/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(checkoutDetails)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.json().then(err => { throw new Error(err.error || 'Checkout failed'); });
            }
        })
        .then(data => {
            alert("Checked out successfully");
            localStorage.removeItem("cartSummary");
            
        })
        .catch(error => {
            console.error('Error during checkout:', error);
            alert(`Error during checkout: ${error.message}`);
        });
    });

    const shippingOptions = document.querySelectorAll('input[name="shippingOption"]');
    shippingOptions.forEach(option => {
        option.addEventListener('change', updateTotalCheckoutPrice);
    });
});

function fetchCartSummary(token) {
    return fetch('/carts/summary', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(body => {
        if (body.error) throw new Error(body.error);
        const cartSummary = body.cartSummary;
        localStorage.setItem("cartSummary", JSON.stringify(cartSummary));
        displayCartSummary(cartSummary);
    })
    .catch(error => {
        console.error('Error retrieving cart summary:', error);
    });
}

function displayCartSummary(cartSummary) {
    const container = document.querySelector("#checkout-summary");
    container.innerHTML = `
        <p>Total Quantity: ${cartSummary.totalQuantity}</p>
        <p id="totalCheckoutPrice">Total Checkout Price: $${cartSummary.totalPrice.toFixed(2)}</p>
        <p>Total Unique Products: ${cartSummary.totalProduct}</p>
    `;
}

function updateTotalCheckoutPrice() {
    const cartSummary = JSON.parse(localStorage.getItem("cartSummary"));
    if (!cartSummary) return;

    const selectedShippingOption = document.querySelector('input[name="shippingOption"]:checked');
    let shippingFee = 0;

    if (selectedShippingOption) {
        switch (selectedShippingOption.value) {
            case 'standard':
                shippingFee = 5.00;
                break;
            case 'express':
                shippingFee = 15.00;
                break;
            case 'overnight':
                shippingFee = 25.00;
                break;
        }
    }

    const totalCheckoutPriceElement = document.getElementById("totalCheckoutPrice");
    const updatedTotalPrice = cartSummary.totalPrice + shippingFee;

    totalCheckoutPriceElement.textContent = `Total Checkout Price: $${updatedTotalPrice.toFixed(2)}`;
}