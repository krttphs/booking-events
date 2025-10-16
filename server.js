require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const session = require('express-session');
const bookRoutes = require('./routes/Book');//ของเพื่อน
const User = require("./models/User");


// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// ตั้งค่า EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
//แก้ 'process.env.SESSION_SECRET'เป็น process.env.SESSION_SECRET || 'fallbackSecret'
app.use(session({ secret: process.env.SESSION_SECRET || 'fallbackSecret', resave: false, saveUninitialized: true }));
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user;
    next();
});
//ส่ง coins ไปให้ header ใช้ได้
app.use(async (req, res, next) => {
  if (req.session.user?._id) {
    const user = await User.findById(req.session.user._id).lean();
    res.locals.user = user;
    res.locals.coins = user.coin || 0;
  } else {
    res.locals.user = null;
    res.locals.coins = 0;
  }
  next();
});


// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/events', require('./routes/events'));
app.use('/organizer', require('./routes/organizer'));
// --------------เพิ่มby modem----------------
app.use('/attendee', require('./routes/attendee')); 
//-----------ของเพื่อน------------------
app.use('/book', bookRoutes);
app.use('/coin', require('./routes/coin'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});