const express = require('express');
const favouritesController = require('../controllers/favouritesController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

const router = express.Router();

router.use(jwtMiddleware.verifyToken);


router.post('/add', favouritesController.addFavourite);

router.get('/', favouritesController.retrieve);

router.delete('/remove/:id', favouritesController.remove); 

module.exports = router;
