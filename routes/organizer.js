const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');
const Event = require('../models/Event'); // ✅ เพิ่มบรรทัดนี้

// มีหน้า Dashboard เพื่อดูรายชื่อผู้ที่ซื้อบัตรในอีเวนต์ของตนเอง
router.get('/dashboard', organizerController.getDashboard);

router.get("/manage-event", async (req, res) => {
    try {
        const organizerId = req.session.user._id; 
        const events = await Event.find({ organizer: organizerId }); // แสดงeventเฉพาะของแต่ละorganizer
        res.render("organizer/manage-event", { events });
    } catch (err) {
        console.error(err);
        res.status(500).send("เกิดข้อผิดพลาดในการโหลดอีเวนท์");
    }
});

// เส้นทางสำหรับแสดงหน้าฟอร์มสร้างอีเวนต์
router.get('/create-event', (req, res) => {
    // ตรวจสอบว่าเป็น Organizer หรือไม่ก่อนแสดงหน้า
    if (req.session.user && req.session.user.role === 'Organizer') {
        //ส่งค่า event เป็น null เพื่อเลือกเป็นหน้าสร้างข้อมูลอีเวนต์ใหม่ กัน error
        res.render('organizer/create-event', { event: null });
    } else {
        res.status(403).send('Access denied.');
    }
});
// สร้าง, แก้ไข, และลบอีเวนต์ของตนเองได้
router.post('/create-event', organizerController.createEvent);

// แก้ไขอีเวนต์
router.get('/edit-event/:id', organizerController.editEventPage);
router.post('/edit-event/:id', organizerController.updateEvent);

// ลบอีเวนต์
router.post('/delete-event/:id', organizerController.deleteEvent);

/*----------------------เพิ่ม-----------------------------------*/
//รายชื่อคนซื้อบัตรทั้งหมด
router.get('/buyer-list/:id', organizerController.getBuyers);

module.exports = router;