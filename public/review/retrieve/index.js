function fetchUserReview() {
    const token = localStorage.getItem('token');

}

document.addEventListener('DOMContentLoaded', function () {
	fetchUserReview()
		.catch(function (error) {
			
			console.error(error);
		});
});