const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// router.get('/', async (req, res) => {
//   try {
//     const events = await Event.find();
//     res.render('index', { events });
    
//   } catch (err) {
//     res.status(500).send('Error loading events.');
//   }
// });
router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();

    const filter = q
      ? {
          $or: [
            { name:        { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { location:    { $regex: q, $options: 'i' } },
          ],
        }
      : {};

    const baseQuery = Event.find(filter).sort({ date: 1 });
    const events = q ? await baseQuery.lean() : await baseQuery.limit(8).lean(); // ไม่มี q ก็โชว์บางส่วน

    res.render('index', {
      pageTitle: q ? `ผลการค้นหา: ${q}` : 'หน้าแรก',
      events,
      q, // <<<< สำคัญ ส่งให้ EJS
      user: req.session?.user || null,
    });
  } catch (err) {
    console.error('[GET /] error:', err);
    res.status(500).send('ไม่สามารถโหลดหน้าแรกได้');
  }
});

//เพิ่ม api
router.get('/api/event', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
    
  } catch (err) {
    res.status(500).send('Error loading events.');
  }
});

module.exports = router;