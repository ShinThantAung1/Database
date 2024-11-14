window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const productId = localStorage.getItem('favouriteProductId');
    const productIdInput = document.querySelector("input[name='productId']");
    productIdInput.value = productId;

    const form = document.querySelector('form');
    form.onsubmit = function (e) {
        e.preventDefault(); 

        const productId = form.querySelector('input[name=productId]').value;

        
        fetch('/favourites/add', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: productId }),
        })
        .then(function (response) {
            if (response.ok) {
                alert('Favourite added successfully!');
                // Clear the input field
                // form.querySelector('input[name=productId]').value = '';
            } else {
                // If fail, show the error message
                response.json().then(function (data) {
                    alert(`Error adding favourite - ${data.error}`);
                });
            }
        })
        .catch(function (error) {
            alert('Error adding favourite');
            console.error(error);
        });
    };
});