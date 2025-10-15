//-----------ของเพื่อน------------------
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  event: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  zone: { 
    type: String, 
    required: true 
  }, // เช่น "VIP", "A", "B"
  seatNumber: { 
    type: String, 
    required: true 
  }, // เช่น "A12" หรือ "VIP-027"
  price: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['reserved', 'paid', 'cancelled'], 
    default: 'reserved' 
  },
  bookedAt: { 
    type: Date, 
    default: Date.now 
  },
  paymentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment', 
    default: null 
  }
});

module.exports = mongoose.model('Seat', seatSchema);
