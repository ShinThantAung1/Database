const { PrismaClient, Prisma } = require('@prisma/client'); // Ensure Prisma is imported correctly
const prisma = new PrismaClient();

module.exports.createSingleCartItem = function createSingleCartItem(memberId, productId, quantity) {
  return prisma.cart.create({
    data: {
      memberId: memberId,
      productId: parseInt(productId),
      quantity: parseInt(quantity),
    }
  }).then(function (cartItem) {
    return cartItem;
  }).catch(function (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error(`The cart item with productId ${productId} for memberId ${memberId} already exists`);
      }
    }
    throw error;
  });
};

module.exports.createMultipleCartItems = function createMultipleCartItems(memberId, items) {
  const createPromises = items.map(item => {
    return prisma.cart.create({
      data: {
        memberId: memberId,
        productId: parseInt(item.productId),
        quantity: parseInt(item.quantity),
      }
    });
  });

  return Promise.all(createPromises)
    .then(results => {
      return results;
    })
    .catch(function (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new Error('One or more cart items already exist');
        }
      }
      console.error('Error in createMultipleCartItems model:', error);
      throw error;
    });
};

module.exports.getAllCartItems = function getAllCartItems(memberId) {
  return prisma.cart.findMany({
    where: { memberId: memberId },
    include: {
      product: true,
    },
  }).then(function (cartItems) {
    return cartItems;
  }).catch(function (error) {
    throw error;
  });
};

module.exports.updateCartItem = function updateCartItem(memberId, productId, quantity) {
  return prisma.cart.updateMany({
    where: { 
      memberId: memberId, 
      productId: parseInt(productId) 
    },
    data: { quantity: parseInt(quantity) },
  }).then(function (cartItem) {
    return cartItem;
  }).catch(function (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error(`The cart item with productId ${productId} for memberId ${memberId} does not exist`);
      }
    }
    throw error;
  });
};

module.exports.deleteCartItem = function deleteCartItem(memberId, productId) {
  return prisma.cart.deleteMany({
    where: { 
      memberId: memberId, 
      productId: parseInt(productId) 
    },
  }).then(function (result) {
    return result;
  }).catch(function (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error(`The cart item with productId ${productId} for memberId ${memberId} does not exist`);
      }
    }
    throw error;
  });
};

module.exports.updateMultipleCartItems = function updateMultipleCartItems(memberId, items) {
  const updatePromises = items.map(item => {
    return prisma.cart.updateMany({
      where: { 
        memberId: memberId, 
        productId: parseInt(item.productId) 
      },
      data: { quantity: parseInt(item.quantity) },
    });
  });
  return Promise.all(updatePromises)
    .then(results => {
      return results;
    })
    .catch(function (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error('One or more cart items could not be updated');
      }
      throw error;
    });
};

module.exports.deleteMultipleCartItems = function deleteMultipleCartItems(memberId, productIds) {
  return prisma.cart.deleteMany({
    where: { 
      memberId: memberId,
      productId: { in: productIds.map(id => parseInt(id)) }
    },
  }).then(function (result) {
    return result;
  }).catch(function (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error('One or more cart items could not be deleted');
    }
    throw error;
  });
};

module.exports.getCartSummary = function getCartSummary(memberId) {
  return prisma.cart.aggregate({
    where: { memberId: memberId },
    _sum: {
      quantity: true,
    },
    _count: {
      productId: true,
    }
  }).then(function (summary) {
    return prisma.cart.findMany({
      where: { memberId: memberId },
      include: { product: true }
    }).then(function (cartItems) {
      const totalPrice = cartItems.reduce((acc, item) => acc + (item.quantity * item.product.unitPrice), 0);
      return {
        totalQuantity: summary._sum.quantity || 0,
        totalPrice: totalPrice,
        totalProduct: summary._count.productId || 0
      };
    });
  }).catch(function (error) {
    throw error;
  });
};