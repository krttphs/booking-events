const express = require('express');
const router = express.Router();
const User = require('../models/User');
const coinController = require('../controllers/coinController');

// แสดงหน้าเติม coin
router.get('/', async (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');
    const user = await User.findById(req.session.user._id);
    res.render('attendee/coin', { user });
});

// เพิ่ม coin
router.post('/add', coinController.addCoins);

module.exports = router;