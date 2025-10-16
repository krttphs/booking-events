const User = require('../models/User');

exports.showProfileForm = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');
        const user = await User.findById(req.session.user._id);
        res.render('attendee/profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('เกิดข้อผิดพลาด');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');
        const { firstName, lastName, email, tel } = req.body;
        //update DB
        await User.findByIdAndUpdate(req.session.user._id, { firstName, lastName, email, tel });
        
        // อัปเดต session ด้วยข้อมูลใหม่
        req.session.user.firstName = firstName;
        req.session.user.lastName = lastName;
        req.session.user.email = email;
        req.session.user.tel = tel;
        res.redirect('/events'); // กลับไปหน้าอีเวนต์หรือหน้าอื่น
    } catch (err) {
        console.error(err);
        res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
};
