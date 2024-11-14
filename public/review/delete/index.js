window.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');

    form.onsubmit = function (e) {
        e.preventDefault();

        const reviewId = form.querySelector('input[name=reviewId]').value;
        const token = localStorage.getItem('token');

        if (!reviewId || isNaN(parseInt(reviewId, 10))) {
            alert('Invalid reviewId. Please enter a valid number.');
            return;
        }

     
        fetch(`/reviews/`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reviewId: parseInt(reviewId, 10) }) 
        }).then(function (response) {
            if (response.ok) {
               
                alert(`Review ${reviewId} deleted!`);
                form.querySelector('input[name=reviewId]').value = "";
            } else {
               
                response.json().then(function (data) {
                    alert(`Error deleting review ${reviewId} - ${data.error}`);
                });
            }
        })
        .catch(function (error) {
            alert(`Error deleting review ${reviewId}`);
        });
    };
});
