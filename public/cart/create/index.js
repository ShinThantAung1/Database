window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const cartProductId = localStorage.getItem('cartProductId');

    const productIdInput = document.querySelector("input[name='productId']");
    const cartProductIdSpan = document.getElementById("cart-product-id");

    if (productIdInput && cartProductId) {
        productIdInput.value = cartProductId;
        cartProductIdSpan.textContent = cartProductId;
    }

    const form = document.querySelector('form');
    form.onsubmit = function (e) {
        e.preventDefault(); 

        const productId = form.querySelector('input[name=productId]').value;
        const quantity = form.querySelector('input[name=quantity]').value;

        if (!productId || !quantity) {
            alert('Product ID and Quantity are required.');
            return;
        }

        fetch('/carts/item', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: productId, quantity: quantity }),
        })
        .then(function (response) {
            if (response.ok) {
                alert('Cart item added successfully!');
            } else {
                response.json().then(function (data) {
                    alert(`Error adding cart item - ${data.error}`);
                });
            }
        })
        .catch(function (error) {
            alert('Error adding cart item');
            console.error(error);
        });
    };
});
