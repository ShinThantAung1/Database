window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem("token");

    fetchFavourites();

    function fetchFavourites() {
        fetch('/favourites', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            } else {
                return response.text().then(text => {
                    throw new Error(`Unexpected response format: ${text}`);
                });
            }
        })
        .then(body => {
            if (body.error) throw new Error(body.error);
            const favourites = body.favourites;
            console.log('Favourites:', favourites);  
            const container = document.querySelector("#favourite-card-container");
            container.innerHTML = '';
            favourites.forEach(favourite => {
                const card = document.createElement("div");
                card.className = "card";

                const productName = document.createElement("h3");
                const productDescription = document.createElement("p");
                const productUnitPrice = document.createElement("p");
                const productImage = document.createElement("img");
                const addedDate = document.createElement("p");

                productName.textContent = favourite.productName || 'No Name';
                productDescription.textContent = favourite.productDescription || 'No Description';
                productUnitPrice.textContent = `Price: $${favourite.productUnitPrice || 'N/A'}`;
                productImage.src = favourite.productImageUrl || '/images/default.jpg';
                productImage.alt = favourite.productName || 'No Image';
                addedDate.textContent = `Added Date: ${new Date(favourite.addedDate).toLocaleString() || 'N/A'}`;

                const buttonContainer = document.createElement("div");
                buttonContainer.className = "button-container";

                const viewButton = document.createElement("button");
                viewButton.textContent = "View Product";
                viewButton.addEventListener('click', function () {
                    localStorage.setItem("productId", favourite.productId);
                    window.location.href = `/product/retrieve`;
                });

                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove from Favourite";
                removeButton.addEventListener('click', function () {
                    removeFromFavourite(favourite.id);
                });

                const addButton = document.createElement("button");
                addButton.textContent = "Add to Cart";
                addButton.addEventListener('click', function () {
                    localStorage.setItem("cartProductId", favourite.productId);
                    window.location.href = `/cart/create`;
                });

                buttonContainer.appendChild(viewButton);
                buttonContainer.appendChild(removeButton);
                buttonContainer.appendChild(addButton);

                card.appendChild(productImage);
                card.appendChild(productName);
                card.appendChild(productDescription);
                card.appendChild(productUnitPrice);
                card.appendChild(addedDate);
                card.appendChild(buttonContainer);

                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Error fetching favourites:", error);
        });
    }

    function removeFromFavourite(favouriteId) {
        fetch(`/favourites/remove/${favouriteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            fetchFavourites(); // Refresh the favourites list after removal
        })
        .catch(error => {
            console.error("Error removing favourite:", error);
        });
    }
});