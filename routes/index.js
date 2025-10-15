const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.render('index', { events });
    
  } catch (err) {
    res.status(500).send('Error loading events.');
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