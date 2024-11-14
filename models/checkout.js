const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.createSaleOrder = function createSaleOrder(memberId, callback) {
    console.log('Creating sale order for memberId:', memberId);

    prisma.$executeRaw`
        CALL public.place_orders(${Number(memberId)}::integer)
    `
    .then(() => {
        return prisma.$queryRaw`
            SELECT "itemName" FROM temp_insufficient_items WHERE "memberId" = ${Number(memberId)}
        `;
    })
    .then(insufficientItems => {
        const itemNames = insufficientItems.map(item => item.itemName);
        console.log('Insufficient Items:', itemNames);
        callback(null, itemNames);
    })
    .catch(error => {
        console.error('Error in createSaleOrder model:', error);
        callback(new Error(error.message || 'Error creating sale order'));
    });
};

module.exports.clearCart = function clearCart(memberId, callback) {
    console.log('Clearing cart for memberId:', memberId);

    prisma.cart.deleteMany({
        where: { memberId: memberId }
    })
    .then(() => {
        callback(null, { message: 'Cart cleared' });
    })
    .catch(error => {
        console.error('Error in clearCart model:', error);
        callback(new Error(error.message || 'Error clearing cart'));
    });
};

module.exports.getCartItems = function getCartItems(memberId, callback) {
    console.log('Fetching cart items for memberId:', memberId);

    prisma.cart.findMany({
        where: { memberId: memberId },
        include: { product: true }
    })
    .then(cartItems => {
        console.log('Cart items fetched:', cartItems);
        callback(null, cartItems);
    })
    .catch(error => {
        console.error('Error in getCartItems model:', error);
        callback(new Error(error.message || 'Error fetching cart items'));
    });
};