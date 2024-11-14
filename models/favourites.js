const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');


module.exports.addFavourite = function addFavourite(memberId, productId) {
    const sql = 'CALL add_favourite($1, $2)';
    return query(sql, [memberId, productId]);
};


module.exports.retrieveFavourites = function retrieveFavourites(memberId) {
    const sql = 'SELECT * FROM get_favourites_by_member_id($1)';
    return query(sql, [memberId])
        .then(result => result.rows)
        .catch(error => {
            console.error('Error executing query:', error);
            throw error;
        });
};

module.exports.removeFavourite = function removeFavourite(favouriteId) {
    const sql = 'CALL remove_favourite($1)';
    return query(sql, [favouriteId])
        .then(result => result)
        .catch(error => {
            console.error('Error executing query:', error);
            throw error;
        });
};