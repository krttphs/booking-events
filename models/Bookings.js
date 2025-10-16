//-----------ของเพื่อน------------------
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const bookingSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seats: { type: [String], default: [] },
  zone: { type: String },
  totalPrice: { type: Number, default: 0 },
  status: { type: String, enum: ["pending","confirmed"],default: 'confirmed' },//แก้ให้มี2สถานะในการชำระเงิน
  bookedAt: { type: Date, default: Date.now },
  ticketId: { type: String, default: uuidv4 }, //<- เพิ่มสำหรับเก็บเป็น path ให้ไปแสดงหน้าตั๋ว
  qrCode: { type: String } //<- เก็บ QRCode
});

module.exports = mongoose.model('Booking', bookingSchema);
