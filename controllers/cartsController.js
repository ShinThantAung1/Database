const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR } = require('../errors');
const cartsModel = require('../models/carts');

module.exports.create = function (req, res) {
    const memberId = res.locals.member_id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    cartsModel.createSingleCartItem(memberId, productId, quantity)
        .then(() => {
            res.sendStatus(201);
        })
        .catch((error) => {
            console.error('Error in create controller:', error);
            res.status(500).json({ error: `Error adding item to cart: ${error.message}` });
        });
};

module.exports.getAll = function (req, res) {
    const memberId = res.locals.member_id;

    cartsModel.getAllCartItems(memberId)
        .then((cartItems) => {
            res.status(200).json({ cartItems });
        })
        .catch((error) => {
            console.error('Error in getAll controller:', error);
            res.status(500).json({ error: `Error retrieving cart items: ${error.message}` });
        });
};

module.exports.update = function (req, res) {
    const memberId = res.locals.member_id;
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    cartsModel.updateCartItem(memberId, productId, quantity)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((error) => {
            console.error('Error in update controller:', error);
            res.status(500).json({ error: `Error updating item in cart: ${error.message}` });
        });
};

module.exports.delete = function (req, res) {
    const memberId = res.locals.member_id;
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    cartsModel.deleteCartItem(memberId, productId)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((error) => {
            console.error('Error in delete controller:', error);
            res.status(500).json({ error: `Error deleting item from cart: ${error.message}` });
        });
};

module.exports.bulkUpdate = function (req, res) {
    const memberId = res.locals.member_id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    cartsModel.updateMultipleCartItems(memberId, items)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((error) => {
            console.error('Error in bulkUpdate controller:', error);
            res.status(500).json({ error: `Error updating items in cart: ${error.message}` });
        });
};

module.exports.bulkDelete = function (req, res) {
    const memberId = res.locals.member_id;
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    cartsModel.deleteMultipleCartItems(memberId, productIds)
        .then(() => {
            res.sendStatus(200);
        })
        .catch((error) => {
            console.error('Error in bulkDelete controller:', error);
            res.status(500).json({ error: `Error deleting items from cart: ${error.message}` });
        });
};

module.exports.getSummary = function (req, res) {
    const memberId = res.locals.member_id;

    cartsModel.getCartSummary(memberId)
        .then((cartSummary) => {
            res.status(200).json({ cartSummary });
        })
        .catch((error) => {
            console.error('Error in getSummary controller:', error);
            res.status(500).json({ error: `Error retrieving cart summary: ${error.message}` });
        });
};