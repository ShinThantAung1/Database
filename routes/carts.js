const express = require('express');
const cartController = require('../controllers/cartsController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

// All routes in this file will use the jwtMiddleware to verify the token and check if the user is an admin.
// Here the jwtMiddleware is applied at the router level to apply to all routes in this file
// But you can also apply the jwtMiddleware to individual routes
// router.use(jwtMiddleware.verifyToken, jwtMiddleware.verifyIsAdmin);

router.use(jwtMiddleware.verifyToken);

router.post('/item', cartController.create);
router.get('/items', cartController.getAll);
router.get('/summary', cartController.getSummary);
router.put('/item', cartController.update);
router.delete('/item', cartController.delete);
router.put('/bulk-update', cartController.bulkUpdate);
router.post('/bulk-delete', cartController.bulkDelete)

module.exports = router;