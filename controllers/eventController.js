const Event = require('../models/Event');
const User = require('../models/User');
// const Purchase = require('../models/Purchase'); เอาออกใช้bookingแทน
const Booking = require('../models/Bookings');//ของเพื่อน
const QRCode = require('qrcode');

exports.getEvents = async (req, res) => {
  try {
    const {
      q,                 // คำค้นหา (ชื่อ/รายละเอียด/สถานที่)
      location,          // สถานที่
      start, end,        // ช่วงวัน: YYYY-MM-DD หรือ datetime-local
      minPrice, maxPrice,// ช่วงราคา
      available,         // '1' = เหลือบัตร
      upcoming,          // '1' = เฉพาะอนาคต
      sort,              // 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc'
      page = 1,          // เพจ
      limit = 9          // ต่อหน้า
    } = req.query;

    const filter = {};

    // ค้นหาข้อความ (ชื่อ/รายละเอียด/สถานที่)
    if (q && q.trim()) {
      const term = q.trim();
      filter.$or = [
        { name:       { $regex: term, $options: 'i' } },
        { description:{ $regex: term, $options: 'i' } },
        { location:   { $regex: term, $options: 'i' } },
      ];
    }

    // กรองสถานที่
    if (location && location.trim()) {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    // กรองช่วงวันที่
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end)   filter.date.$lte = new Date(end);
    }

    // เฉพาะอนาคต
    if (upcoming === '1') {
      filter.date = { ...(filter.date || {}), $gte: new Date() };
    }

    // ช่วงราคา
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // เหลือบัตร (กรณีคุณยังใช้ ticketCount เป็นคงเหลือ)
    if (available === '1') {
      filter.ticketCount = { $gt: 0 };
    }

    // เรียงลำดับ
    const sortMap = {
      date_asc:  { date: 1 },
      date_desc: { date: -1 },
      price_asc: { price: 1 },
      price_desc:{ price: -1 },
    };
    const sortStage = sortMap[sort] || { date: 1 };

    // เพจ/ลิมิต
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 9, 1), 48);
    const skip = (pageNum - 1) * perPage;

    // คิวรี
    const [items, total] = await Promise.all([
      Event.find(filter).sort(sortStage).skip(skip).limit(perPage).lean(),
      Event.countDocuments(filter)
    ]);

    const totalPages = Math.max(Math.ceil(total / perPage), 1);

    return res.render('events/list', {
      pageTitle: 'อีเวนต์ทั้งหมด',
      events: items,
      // ส่งค่าฟอร์มกลับไปเพื่อคง state
      q: q || '',
      location: location || '',
      start: start || '',
      end: end || '',
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
      available: available || '',
      upcoming: upcoming || '',
      sort: sort || 'date_asc',
      page: pageNum,
      totalPages,
      limit: perPage,
      total
    });
  } catch (err) {
    console.error('[getEvents filter]', err);
    return res.status(500).send('โหลดรายการอีเวนต์ไม่สำเร็จ');
  }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.render('index', { events });
    } catch (err) {
        res.status(500).send('Error loading events.');
    }
};

exports.getEventDetails = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).send('Event not found.');
        if (!event.zones) event.zones = [];

        res.render('event-detail', {
            event,
            currentUser: req.session.user || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading event details.');
    }
};

exports.bookTicket = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const eventId = req.params.id;
        const selectedZone = req.body.zone; // ✅ รับค่าจาก form
        const quantity = parseInt(req.body.quantity);
        if (!quantity || quantity <= 0) return res.status(400).send('กรุณาเลือกจำนวนที่นั่งที่ถูกต้อง');

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).send('Event not found.');
        }

        const numSeats = parseInt(req.body.quantity); // จำนวนที่นั่งจากผู้ใช้
        // ตรวจสอบจำนวนที่นั่ง 1-4
        if (isNaN(numSeats) || numSeats < 1 || numSeats > 4) {
            return res.status(400).send('คุณสามารถซื้อได้สูงสุด 4 ที่นั่งต่อบัญชีเท่านั้น');
        }

        // ✅ หาว่า zone ไหนถูกเลือก
        const zone = event.zones.find(z => z.name === selectedZone);
        if (!zone) {
            return res.status(400).send('Zone not found.');
        }

        // --- จุดแก้ไขที่ 1 (คงไว้เหมือนเดิม) ---
        // ป้องกันกรณี document เก่าใน DB ไม่มี bookedSeats
        if (!Array.isArray(zone.bookedSeats)) {
            zone.bookedSeats = [];
        }

        // ✅ ตรวจสอบว่ามีที่เหลือไหม
        const availableSeats = zone.seats - zone.bookedSeats.length;
        if (availableSeats <= 0) {
            return res.status(400).send(`โซน ${selectedZone} เต็มแล้ว`);
        }
        else if (numSeats > availableSeats) {
            return res.status(400).send(`โซน ${selectedZone} มีที่นั่งคงเหลือ ${availableSeats} ที่`);
        }

        const remainingSeats = zone.seats - zone.bookedSeats.length;
        if (quantity > remainingSeats) 
        return res.status(400).send(`จำนวนที่นั่งเกินโควต้า! คงเหลือ: ${remainingSeats}`);

        const totalPrice = zone.price * quantity;
        
        const user = await User.findById(req.session.user._id);

        // ตรวจสอบ coin
        if (user.coin < totalPrice) {
            return res.redirect('/coin');
        }

        // ลด coin และบันทึก
        user.coin -= totalPrice;

        // สร้างเลขที่นั่งหลายที่
        const seatNumbers = [];
        for (let i = 0; i < numSeats; i++) {
            const seatNumber = `${selectedZone}${zone.bookedSeats.length + 1}`;
            zone.bookedSeats.push(seatNumber);
            seatNumbers.push(seatNumber);
        }

        // ลดจำนวน ticketCount ของ event
        // event.ticketCount = Math.max(event.ticketCount - numSeats, 0);//ลดได้ไม่เกิน0
        await event.save();
        req.session.user.coin = user.coin;
        // เพิ่มประวัติการซื้อบัตรใน user
        if (!Array.isArray(user.ticketHistory)) {
            user.ticketHistory = [];
        }
        user.ticketHistory.push({
            event: event._id,
            purchaseDate: new Date(),
            seats: seatNumbers,
            zone: selectedZone
        });
        await user.save();

        // สร้าง Booking
        const booking = await Booking.create({
            user: user._id,
            event: event._id,
            seats: seatNumbers,
            zone: selectedZone,
            totalPrice: zone.price * numSeats,// --- จุดแก้ไขที่ 4 (ใช้ราคาจากโซน) ---
            status: 'confirmed',
            bookedAt: new Date()
        });

        const ticketUrl = `${req.protocol}://${req.get('host')}/events/ticket/${booking._id}`;
        const qrData = await QRCode.toDataURL(ticketUrl);
        booking.qrCode = qrData;
        await booking.save();
        console.log('Generated Ticket URL:', ticketUrl);

        // --- จุดแก้ไขที่ 5 (แก้ไข Redirect) ---
        // ใส่ / ข้างหน้าเพื่อให้เป็น absolute path
        res.redirect('/events/history');
    } catch (err) {
        console.error(err);
        res.status(500).send('Booking failed.');
    }
};

exports.getBookingHistory = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const userId = req.session.user._id;
        const tickets = await Booking.find({ user: userId })
            .populate('event', 'name date location image') // ดึงข้อมูลอีเวนต์มาใช้ด้วย
            .sort({ bookedAt: -1 }); // เรียงจากล่าสุด

        res.render('attendee/history', { tickets });
    } catch (err) {
        console.error(err);
        res.status(500).send('ไม่สามารถโหลดประวัติการจองได้');
    }
};


/*---------UPDATE TICKET-------*/
exports.getEventTicket = async (req, res) => {
    try {
        const ticket = await Booking.findById(req.params.id)
            .populate('event', 'name date location image');
        if (!ticket) return res.status(404).send('ไม่พบตั๋ว');

        res.render('ticket', { ticket });
    } catch (err) {
        console.error(err);
        res.status(500).send("ไม่สามารถแสดงหน้าตั๋วได้");
    }
};

