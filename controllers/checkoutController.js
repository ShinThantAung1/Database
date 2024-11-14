const { EMPTY_RESULT_ERROR, UNIQUE_VIOLATION_ERROR } = require('../errors');
const checkoutModel = require('../models/checkout');

module.exports.checkout = function (req, res) {
    const memberId = res.locals.member_id;
    const { shippingOption } = req.body;

    console.log('Checkout initiated with memberId:', memberId, 'and shippingOption:', shippingOption);

    checkoutModel.getCartItems(memberId, function(error, cartItems) {
        if (error) {
            console.error('Error fetching cart items:', error);
            return res.status(500).json({ error: error.message || 'Error fetching cart items' });
        }

        if (cartItems.length === 0) {
            console.log('Cart is empty for memberId:', memberId);
            return res.status(400).json({ error: "Cart is empty" });
        }

        const cartSummary = cartItems.reduce((summary, item) => {
            summary.totalQuantity += parseInt(item.quantity);
            summary.totalPrice += item.product.unitPrice * item.quantity;
            return summary;
        }, { totalQuantity: 0, totalPrice: 0 });

        let shippingFee = 0;
        switch (shippingOption) {
            case 'standard':
                shippingFee = 5.00;
                break;
            case 'express':
                shippingFee = 15.00;
                break;
            case 'overnight':
                shippingFee = 25.00;
                break;
            default:
                return res.status(400).json({ error: "Invalid shipping option" });
        }

        const totalCheckoutPrice = cartSummary.totalPrice + shippingFee;

        console.log('Creating sale order for memberId:', memberId, 'with cart items:', cartItems);

        checkoutModel.createSaleOrder(memberId, function(error, insufficientItems) {
            if (error) {
                console.error('Error creating sale order:', error);
                return res.status(500).json({ error: error.message || 'Error creating sale order' });
            }

            if (insufficientItems.length > 0) {
                console.log('Insufficient items:', insufficientItems);
                return res.status(400).json({ error: "Insufficient stock for some items", insufficientItems });
            }

            checkoutModel.clearCart(memberId, function(error) {
                if (error) {
                    console.error('Error clearing cart:', error);
                    return res.status(500).json({ error: error.message || 'Error clearing cart' });
                }

                res.status(201).json({ message: "Checkout successful" });
            });
        });
    });
};