const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

module.exports.createReview = function createReview(memberId, productId, orderId, rating, reviewText, reviewDate) {
    const sql = 'CALL create_review($1::INT, $2::INT, $3::INT, $4::INT, $5::TEXT, $6::DATE)';
    return query(sql, [productId, memberId, orderId, rating, reviewText, reviewDate])
        .then(result => {
            console.log('Review created successfully');
        })
        .catch(error => {
            console.error('Error executing query:', error);
            throw error;
        });
};

module.exports.getAllReviews = function getAllReviews(memberId) {
    const sql = 'SELECT * FROM get_all_reviews($1::INT)';
    return query(sql, [memberId])
        .then(result => result.rows)
        .catch(error => {
            console.error('Error executing query:', error);
            throw error;
        });
};


module.exports.updateReview = function updateReview(reviewId, rating, reviewText) {
    const sql = 'CALL update_review($1, $2, $3)';
    return query(sql, [reviewId, rating, reviewText])
        .then(result => {
            console.log('Review updated successfully');
        })
        .catch(error => {
            console.error('Error executing query:', error);
            throw error;
        });
};

module.exports.deleteReview = function deleteReview(reviewId) {
    const sql = 'CALL delete_review($1)';
    return query(sql, [reviewId])
        .then(result => {
            console.log('Review deleted successfully');
        })
        .catch(error => {
            console.error('Error executing query:', error);
            throw error;
        });
};