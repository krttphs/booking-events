const User = require('../models/User');
const bcrypt = require('bcryptjs'); // ต้องติดตั้งแพ็กเกจนี้ก่อน

// แก้ไขฟังก์ชัน register ให้ถูกต้อง
exports.register = async (req, res) => {
    try {
        const { username, password, role, firstName, lastName, email, tel } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            role: 'Attendee', // กำหนดบทบาทให้ผู้ใช้ทุกคนที่ลงทะเบียนเป็น Attendee
            firstName,
            lastName,
            email,
            tel
        });
        
        await newUser.save();
        res.redirect('/auth/login');
    } catch (err) {
        res.status(500).send('Registration failed: ' + err.message);
    }
};

// แก้ไขฟังก์ชัน login ให้ถูกต้อง
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password.');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid username or password.');
        }

        req.session.user = {
            _id: user._id,
            role: user.role,
            username: user.username
        };
        if (user.role === 'Organizer') {
            res.redirect('/organizer/dashboard');
        } else {
            res.redirect('/');
        }
    } catch (err) {
        res.status(500).send('Login failed: ' + err.message);
    }
};