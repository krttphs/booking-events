const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  showStart: { type: String, required: true, default: '' }, // ✅ เพิ่ม default
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  /* เพิ่มของเพื่อน */
  zones: [
    {
      name: { type: String, required: true, default: '' },        // A, B, C, D
      seats: { type: Number, required: true, default: 0 },        // จำนวนที่นั่งในโซน
      price: { type: Number, required: true, default: 0 },        // ราคาบัตร
      type: { type: String, enum: ["Standing", "Seated"], required: true, default: 'Seated' }, // default Seated
      bookedSeats: { type: [String], default: [] },   // เก็บเลขที่นั่งที่ถูกจองแล้ว
    }
  ]

  // zone: { type: String, required: true },
  // type: { type: String, enum: ["Standing", "Seated"], required: true }
});

module.exports = mongoose.model('Event', eventSchema);
