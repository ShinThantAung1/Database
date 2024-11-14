const { query } = require('../database');
const { EMPTY_RESULT_ERROR, SQL_ERROR_CODE, UNIQUE_VIOLATION_ERROR } = require('../errors');

const { PrismaClient, Prisma } = require('@prisma/client'); // Ensure Prisma is imported correctly
const prisma = new PrismaClient();

module.exports.retrieveAll = function retrieveAll(memberId) {
    let params = [];
    let sql = `SELECT * FROM sale_order_item s JOIN sale_order o ON s.sale_order_id=o.id JOIN product p ON s.product_id=p.id JOIN member m ON o.member_id=m.id`;
    if (memberId) {
        sql += ` WHERE o.member_id = $1`
        params.push(memberId);
    }
    return query(sql, params).then(function (result) {
        const rows = result.rows;

        if (rows.length === 0) {
            throw new EMPTY_RESULT_ERROR(`Sale Order not found!`);
        }

        return rows;
    });
};

module.exports.retrieveFiltered = function retrieveFiltered(filters) {
    const {
        status,
        minOrderDatetime,
        maxOrderDatetime,
        minQuantity,
        maxQuantity,
        searchProductDescription,
        minUnitPrice,
        maxUnitPrice,
        username,
        minDob,
        maxDob,
        sortOrder
    } = filters;

    console.log("Received Filters:", filters);

    const where = {
        AND: [
            status ? { status: { in: status.split(',') } } : undefined,
            minOrderDatetime ? { orderDatetime: { gte: new Date(minOrderDatetime) } } : undefined,
            maxOrderDatetime ? { orderDatetime: { lte: new Date(maxOrderDatetime) } } : undefined,
            {
                saleOrderItem: {
                    some: {
                        AND: [
                            minQuantity && minQuantity !== "" ? { quantity: { gte: parseInt(minQuantity, 10) } } : undefined,
                            maxQuantity && maxQuantity !== "" ? { quantity: { lte: parseInt(maxQuantity, 10) } } : undefined,
                            minUnitPrice && minUnitPrice !== "" ? { product: { unitPrice: { gte: parseFloat(minUnitPrice) } } } : undefined,
                            maxUnitPrice && maxUnitPrice !== "" ? { product: { unitPrice: { lte: parseFloat(maxUnitPrice) } } } : undefined,
                            searchProductDescription && searchProductDescription !== "" ? { product: { description: { contains: searchProductDescription, mode: 'insensitive' } } } : undefined
                        ].filter(Boolean)
                    }
                }
            },
            username && username !== "" ? { member: { username: { contains: username, mode: 'insensitive' } } } : undefined,
            minDob && minDob !== "" ? { member: { dob: { gte: new Date(minDob) } } } : undefined,
            maxDob && maxDob !== "" ? { member: { dob: { lte: new Date(maxDob) } } } : undefined
        ].filter(Boolean)
    };

    console.log("Constructed Where Clause:", JSON.stringify(where, null, 2));

    const orderBy = {};
    if (sortOrder) {
        orderBy.orderDatetime = sortOrder.toLowerCase();
    }

    return prisma.saleOrder.findMany({
        where,
        include: {
            member: true,
            saleOrderItem: {
                include: {
                    product: true
                }
            }
        },
        orderBy
    }).then(saleOrders => {
        if (saleOrders.length === 0) {
            throw new Error('Sale Order not found!');
        }

        const filteredSaleOrders = saleOrders.map(order => ({
            ...order,
            saleOrderItem: order.saleOrderItem.filter(item => 
                (!minQuantity || item.quantity >= parseInt(minQuantity, 10)) &&
                (!maxQuantity || item.quantity <= parseInt(maxQuantity, 10)) &&
                item.product.unitPrice >= parseFloat(minUnitPrice) &&
                (!maxUnitPrice || item.product.unitPrice <= parseFloat(maxUnitPrice))
            )
        })).filter(order => order.saleOrderItem.length > 0);

        return filteredSaleOrders;
    }).catch(error => {
        console.error("Error fetching sale orders:", error);
        throw error;
    });
};