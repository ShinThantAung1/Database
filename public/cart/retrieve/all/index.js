function fetchCartItems(token) {
    return fetch('/carts/items', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to retrieve cart items');
        }
    })
    .then(function (body) {
        if (body.error) throw new Error(body.error);
        const cartItems = body.cartItems || []; 
        const tbody = document.querySelector("#cart-items-tbody");
        tbody.innerHTML = '';

        cartItems.forEach(function (cartItem) {
            const row = document.createElement("tr");
            row.classList.add("product");
            const descriptionCell = document.createElement("td");
            const countryCell = document.createElement("td");
            const quantityCell = document.createElement("td");
            const unitPriceCell = document.createElement("td");
            const subTotalCell = document.createElement("td");
            const updateButtonCell = document.createElement("td");
            const deleteButtonCell = document.createElement("td");
            const checkboxCell = document.createElement("td");
            const updateButton = document.createElement("button");
            const deleteButton = document.createElement("button");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("cart-checkbox");
            checkbox.value = cartItem.productId;

            descriptionCell.textContent = cartItem.product.description;
            countryCell.textContent = cartItem.product.country;
            unitPriceCell.textContent = cartItem.product.unitPrice;
            updateButtonCell.appendChild(updateButton);
            deleteButtonCell.appendChild(deleteButton);
            checkboxCell.appendChild(checkbox);

            const quantityInput = document.createElement("input");
            quantityInput.type = "number";
            quantityInput.value = cartItem.quantity;
            quantityInput.addEventListener("input", function () {
                this.value = this.value.replace(/[^0-9]/g, "");
            });
            quantityCell.appendChild(quantityInput);
            subTotalCell.textContent = cartItem.product.unitPrice * cartItem.quantity;

            updateButton.textContent = "Update";
            deleteButton.textContent = "Delete";

            updateButton.addEventListener("click", function () {
                const updatedQuantity = quantityInput.value;
                const updatedCartItem = {
                    quantity: Number(updatedQuantity),
                    productId: cartItem.productId
                };

                fetch('/carts/item', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(updatedCartItem)
                })
                .then(function (response) {
                    if (response.ok) {
                        alert('Cart item updated successfully!');
                        fetchCartItems(token);
                        fetchCartSummary(token); 
                    } else {
                        response.json().then(function (data) {
                            alert(`Error updating cart item - ${data.error}`);
                        });
                    }
                })
                .catch(function (error) {
                    console.error('Error updating cart item:', error);
                    alert('Error updating cart item');
                });
            });

            deleteButton.addEventListener("click", function () {
                const confirmed = confirm('Are you sure you want to delete this item?');
                if (!confirmed) return;

                fetch('/carts/item', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ productId: cartItem.productId })
                })
                .then(function (response) {
                    if (response.ok) {
                        alert('Cart item deleted successfully!');
                        fetchCartItems(token); 
                        fetchCartSummary(token); 
                    } else {
                        response.json().then(function (data) {
                            alert(`Error deleting cart item - ${data.error}`);
                        });
                    }
                })
                .catch(function (error) {
                    console.error('Error deleting cart item:', error);
                    alert('Error deleting cart item');
                });
            });

            row.appendChild(checkboxCell);
            row.appendChild(descriptionCell);
            row.appendChild(countryCell);
            row.appendChild(subTotalCell);
            row.appendChild(unitPriceCell);
            row.appendChild(quantityCell);
            row.appendChild(updateButtonCell);
            row.appendChild(deleteButtonCell);

            tbody.appendChild(row);
        });

        const selectAllCheckbox = document.getElementById("selectAll");
        selectAllCheckbox.addEventListener("change", function () {
            const cartCheckboxes = document.querySelectorAll(".cart-checkbox");
            cartCheckboxes.forEach(function (checkbox) {
                checkbox.checked = selectAllCheckbox.checked;
            });
        });
    })
    .catch(function (error) {
        console.error('Error retrieving cart items:', error);
    });
}

function bulkUpdateCartItems(token) {
    const selectedItems = document.querySelectorAll(".cart-checkbox:checked");
    const itemsToUpdate = Array.from(selectedItems).map(checkbox => {
        const row = checkbox.closest("tr");
        const productId = checkbox.value;
        const quantity = row.querySelector("input[type='number']").value;
        return { productId, quantity };
    });

    fetch('/carts/bulk-update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsToUpdate })
    })
    .then(function (response) {
        if (response.ok) {
            alert('Cart items updated successfully!');
            fetchCartItems(token); 
            fetchCartSummary(token);
        } else {
            response.json().then(function (data) {
                alert(`Error updating cart items - ${data.error}`);
            });
        }
    })
    .catch(function (error) {
        console.error('Error updating cart items:', error);
        alert('Error updating cart items');
    });
}

function bulkDeleteCartItems(token) {
    const selectedItems = document.querySelectorAll(".cart-checkbox:checked");
    const productIds = Array.from(selectedItems).map(checkbox => checkbox.value);

    fetch('/carts/bulk-delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productIds })
    })
    .then(function (response) {
        if (response.ok) {
            alert('Cart items deleted successfully!');
            fetchCartItems(token); 
            fetchCartSummary(token); 
        } else {
            response.json().then(function (data) {
                alert(`Error deleting cart items - ${data.error}`);
            });
        }
    })
    .catch(function (error) {
        console.error('Error deleting cart items:', error);
        alert('Error deleting cart items');
    });
}

function fetchCartSummary(token) {
    return fetch('/carts/summary', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to retrieve cart summary');
        }
    })
    .then(function (body) {
        if (body.error) throw new Error(body.error);
        const cartSummary = body.cartSummary;
        const cartSummaryDiv = document.querySelector("#cart-summary");
        cartSummaryDiv.innerHTML = '';

        const cartSummaryLabel1 = document.createElement("label");
        cartSummaryLabel1.textContent = "Total Quantity: ";
        cartSummaryLabel1.classList.add("label");
        const cartSummaryValue1 = document.createElement("span");
        cartSummaryValue1.textContent = cartSummary.totalQuantity;
        cartSummaryValue1.classList.add("value");

        const cartSummaryLabel2 = document.createElement("label");
        cartSummaryLabel2.textContent = "Total Checkout Price: ";
        cartSummaryLabel2.classList.add("label");
        const cartSummaryValue2 = document.createElement("span");
        cartSummaryValue2.textContent = cartSummary.totalPrice;
        cartSummaryValue2.classList.add("value");

        const cartSummaryLabel3 = document.createElement("label");
        cartSummaryLabel3.textContent = "Total Unique Products: ";
        cartSummaryLabel3.classList.add("label");
        const cartSummaryValue3 = document.createElement("span");
        cartSummaryValue3.textContent = cartSummary.totalProduct;
        cartSummaryValue3.classList.add("value");

        cartSummaryDiv.appendChild(cartSummaryLabel1);
        cartSummaryDiv.appendChild(cartSummaryValue1);
        cartSummaryDiv.appendChild(document.createElement("br"));
        cartSummaryDiv.appendChild(cartSummaryLabel2);
        cartSummaryDiv.appendChild(cartSummaryValue2);
        cartSummaryDiv.appendChild(document.createElement("br"));
        cartSummaryDiv.appendChild(cartSummaryLabel3);
        cartSummaryDiv.appendChild(cartSummaryValue3);
    })
    .catch(function (error) {
        console.error('Error retrieving cart summary:', error);
    });
}

window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");
    fetchCartItems(token)
        .then(function () {
            return fetchCartSummary(token);
        });

    document.getElementById("bulk-update").addEventListener("click", function () {
        bulkUpdateCartItems(token);
    });

    document.getElementById("bulk-delete").addEventListener("click", function () {
        bulkDeleteCartItems(token);
    });
});
