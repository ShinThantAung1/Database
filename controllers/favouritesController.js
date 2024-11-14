const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR, DUPLICATE_TABLE_ERROR } = require('../errors');
const favouriteModel = require('../models/favourites');


module.exports.addFavourite = function (req, res) {
    const memberId = res.locals.member_id;
    const productId = req.body.productId;

    favouriteModel.addFavourite(memberId, productId)
        .then(() => {
            res.sendStatus(201);
        })
        .catch((error) => {
            console.error('Error in addFavourite controller:', error);
            res.status(500).json({ error: 'Error adding' });
        });
};


module.exports.retrieve = function (req, res) {
    const memberId = res.locals.member_id;

    favouriteModel.retrieveFavourites(memberId)
        .then(result => res.json({ favourites: result }))
        .catch(error => {
            console.error('Error in retrieve controller:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
};


module.exports.remove = function (req, res) {
    const favouriteId = req.params.id;

    favouriteModel.removeFavourite(favouriteId)
        .then(() => res.json({ message: 'Favourite removed successfully' }))
        .catch(error => {
            console.error('Error in remove controller:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        });
};