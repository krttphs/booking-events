const Event = require('../models/Event');
const User = require('../models/User');
const Booking = require('../models/Bookings'); // เพิ่ม

exports.getDashboard = async (req, res) => {
    try {
        const organizerId = req.session.user._id;

        // ดึงอีเวนต์ของ organizer
        // const events = await Event.find({});
        const events = await Event.find({ organizer: organizerId });

        // map เพิ่ม stats ให้แต่ละ event
        const eventsWithStats = await Promise.all(events.map(async (event) => {
            // ดึง Booking ของ event นี้
            const bookings = await Booking.find({ event: event._id });

            const totalPending = bookings.filter(b => b.status !== 'confirmed').length;
            const totalConfirmed = bookings.filter(b => b.status === 'confirmed').length;
            const totalRevenue = bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

            return {
                ...event.toObject(),
                stats: {
                    pending: totalPending,
                    sold: totalConfirmed,
                    revenue: totalRevenue
                }
            };
        }));

        res.render('organizer/dashboard', { events: eventsWithStats });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading dashboard.');
    }
};
exports.createEvent = async (req, res) => {
    try {
        // ดึง organizerId จาก session เพื่อระบุว่าใครเป็นผู้สร้างอีเวนต์
        const organizerId = req.session.user._id;

        // ดึงค่าจากฟอร์ม
        const { name, description, image, date, location, showStart, zones } = req.body;

        // แปลง zones ให้เป็น array ของ object ตาม schema
        let zonesData = [];
        if (zones && Array.isArray(zones)) {
            // ถ้า zones เป็น array ของ object (กรณีหลายโซน)
            zonesData = zones.map(z => ({
                name: z.name || '',
                seats: z.seats ? parseInt(z.seats) : 0,
                price: z.price ? parseInt(z.price) : 0,
                type: z.type || 'Seated',
                bookedSeats: []
            }));
        } else if (zones) {
            // กรณี zones มีโซนเดียว (ส่งมาเป็น object ไม่ใช่ array)
            zonesData = [{
                name: zones.name || '',
                seats: zones.seats ? parseInt(zones.seats) : 0,
                price: zones.price ? parseInt(zones.price) : 0,
                type: zones.type || 'Seated',
                bookedSeats: []
            }];
        }
        const newEvent = new Event({
            name,
            description,
            image,
            date,
            location,
            showStart: showStart || '', // ถ้าไม่ได้ส่งค่าให้ default เป็น ''
            zones: zonesData,
            organizer: organizerId
        });

        await newEvent.save(); // บันทึกอีเวนต์ใหม่ลงในฐานข้อมูล
        res.redirect('/organizer/dashboard'); // หลังจากสร้างเสร็จให้กลับไปหน้า Dashboard
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).send('Error creating event.');
    }
};
exports.editEventPage = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send('Event not found.');
        }
        res.render('organizer/create-event', { event });//ใช้ฟอร์มในไฟล์เดียวกันกับcreate
    } catch (err) {
        res.status(500).send('Error loading edit page.');
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const updatedData = req.body;
        await Event.findByIdAndUpdate(eventId, updatedData);
        res.redirect('/organizer/manage-event');
    } catch (err) {
        res.status(500).send('Error updating event.');
    }
};

//แก้ redirect เพราะ ตอนกดลบใช้ fetch แต่ fetch ไม่ได้ handle redirect
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        await Event.findByIdAndDelete(eventId);
        res.json({ success: true });
        // res.redirect('/organizer/dashboard');
    } catch (err) {
        res.status(500).send('Error deleting event.');
    }
};

/*-----------------UPDATE BUYERS------------------*/
exports.getBuyers = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }

        const eventId = req.params.id;

        // ดึงข้อมูลอีเวนต์ก่อน
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).send('Event not found');
        }

        // ดึงข้อมูลการจองทั้งหมดของอีเวนต์นี้
        const bookings = await Booking.find({ event: eventId })
            .populate('user') // ดึงข้อมูล user ที่จองแต่ละรายการ
            .exec();

        // แปลงข้อมูลให้ง่ายต่อการแสดงผล
        const buyers = bookings.map(b => ({
            firstName: b.user.firstName,
            lastName: b.user.lastName,
            email: b.user.email,
            tel: b.user.tel,
            zone: b.zone,
            seats: b.seats,
            quantity: b.seats.length,
            status: b.status,
            purchaseDate: b.bookedAt,
            totalPrice: b.totalPrice // <-- เพิ่มตรงนี้
        }));

        // ส่งไป render หน้า EJS
        res.render('organizer/buyer-list', { event, buyers });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};
/*-----------------UPDATE MANAGEMENT------------------*/
exports.getManageEvent = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/auth/login');
        const organizerId = req.session.user._id;
        const events = await Event.find({ organizer: organizerId });

        // เพิ่ม stats ให้แต่ละ event
        const eventsWithStats = await Promise.all(events.map(async (event) => {
            const bookings = await Booking.find({ event: event._id, status: 'confirmed' });
            const soldTickets = bookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
            const totalSeats = event.zones?.reduce((sum, z) => sum + (z.seats || 0), 0) || 0;
            const soldOut = soldTickets >= totalSeats;

            return {
                ...event.toObject(),
                stats: { soldTickets, soldOut }
            };
        }));
        console.log('Event:', event.name);
        console.log('Total Seats:', totalSeats);
        console.log('Sold Tickets:', soldTickets);
        console.log('Sold Out?', soldOut);
        
        res.render('organizer/manage-event', { events: eventsWithStats });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading events');
    }
};