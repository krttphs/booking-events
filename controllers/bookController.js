//-----------ของเพื่อน------------------
const Seat = require('../models/Seat');
const Event = require('../models/Event'); // ถ้ามี
const User = require('../models/User');
const Booking = require('../models/Bookings'); // ต้องเพิ่ม

exports.bookSeat = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.session.user._id; // ใช้ session แทน req.user

    const { zone, seats } = req.body; // สมมติ front-end ส่งมาเป็น array ของที่นั่ง

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // ตรวจสอบว่าเลือกที่นั่งซ้ำใน zone เดิมหรือยัง
    const alreadyBooked = await Booking.findOne({ event: eventId, user: userId });
    if (alreadyBooked) return res.status(400).json({ message: 'คุณจอง Event นี้แล้ว' });

    // คำนวณราคา
    const zoneData = event.zones.find(z => z.name === zone);
    const pricePerSeat = zoneData?.price || 0;
    const totalPrice = pricePerSeat * selectedSeats.length;

    // สร้าง Booking ใหม่
    const booking = new Booking({
      event: eventId,
      user: userId,
      zone,
      seats: selectedSeats, // ใส่ array ที่นั่งจริง
      totalPrice,
      status: 'confirmed' // หรือ 'pending' ขึ้นกับ flow การจ่ายเงิน
    });
    await booking.save();
    console.log('Booking saved:', booking);

    res.status(201).json({ message: 'จองสำเร็จ ✅', booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
  }
};
