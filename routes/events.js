const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const bookController = require('../controllers/bookController');
console.log('eventController =>', eventController);
//-------------ของเพื่อน-------------
//ดึงประวัติการจอง: เอามาไว้ก่อน'/:id' เพราะ Express อ่าน route จากบนลงล่าง มันจะเข้าใจผิดว่า history เป็น id
router.get('/history', eventController.getBookingHistory);
//----------------------------------

// ดูรายการอีเวนต์ทั้งหมดที่เปิดขายบัตร
router.get('/', eventController.getAllEvents);

// ดูรายละเอียดของแต่ละอีเวนต์
router.get('/:id', eventController.getEventDetails);

// ทำการจอง/ซื้อบัตร (จำลองการตัดเงิน)
router.post('/:id/book', eventController.bookTicket);

/*---------UPDATE TICKET-------*/
//เรียกดูตั๋วที่ ticket id นั้นๆ
router.get('/ticket/:id', eventController.getEventTicket);
//ตารางรายชื่อผู้ซื้อ
router.post('/:eventId/book-seat', bookController.bookSeat);
module.exports = router;