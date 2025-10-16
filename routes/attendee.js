const express = require('express');
const router = express.Router();
const attendeeConttroller = require('../controllers/attendeeConttroller');

router.get('/profile', attendeeConttroller.showProfileForm);
router.post('/profile', attendeeConttroller.updateProfile);

module.exports = router;