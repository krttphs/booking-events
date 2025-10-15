//-----------ของเพื่อน------------------
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

console.log('bookController =>', bookController); // 👈 ลองเช็กตรงนี้

router.post('/:eventId', bookController.bookSeat);

module.exports = router;