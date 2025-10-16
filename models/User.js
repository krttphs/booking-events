const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Attendee', 'Organizer'], default: 'Attendee' },
  /*เพิ่ม ข้อมูลส่วนตัวผู้ใช้*/
  firstName: { type: String, required: true, },
  lastName: { type: String, required: true, },
  email: { type: String, required: true, },
  tel: { type: String, required: true, },
  coin : { type: Number, default: 0 },

  /*-------------เพิ่ม ticketHistory ----------*/
  ticketHistory: [
    {
      event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
      purchaseDate: { type: Date, default: Date.now },
      seats: { type: [String], default: [] }, // เลขที่นั่งที่ซื้อ
      zone: { type: String } // โซนที่ซื้อ
    }
  ]
});

module.exports = mongoose.model('User', userSchema);