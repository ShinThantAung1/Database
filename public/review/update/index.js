window.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');

    const form = document.querySelector('form'); 

    form.onsubmit = function (e) {
        e.preventDefault();

        const reviewIdInput = form.querySelector('input[name=reviewId]');
        const ratingInput = form.querySelector('select[name=rating]');
        const reviewTextInput = form.querySelector('textarea[name=reviewText]');

        if (!reviewIdInput || !ratingInput || !reviewTextInput) {
            console.error('Review ID, Rating, or Review Text input not found');
            return;
        }

        const reviewId = parseInt(reviewIdInput.value, 10); 
        const rating = parseInt(ratingInput.value, 10); 
        const reviewText = reviewTextInput.value;

        if (isNaN(reviewId)) {
            console.error('Invalid reviewId:', reviewId);
            alert('Invalid reviewId. Please check and try again.');
            return;
        }

      
        fetch(`/reviews`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                reviewId: reviewId, 
                rating: rating,
                reviewText: reviewText
            }),
        })
            .then(function (response) {
                if (response.ok) {
                    alert(`Review updated!`);
                  
                    reviewIdInput.value = "";
                    ratingInput.value = "";
                    reviewTextInput.value = "";
                } else {
                  
                    response.json().then(function (data) {
                        alert(`Error updating review - ${data.error}`);
                    });
                }
            })
            .catch(function (error) {
                alert(`Error updating review`);
            });
    };
});