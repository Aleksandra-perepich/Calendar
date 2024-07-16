const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  theme: { type: String, required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
});

const BookingSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  themes: { type: Array, required: true },
  level: { type: String, required: true },
  participants: [ParticipantSchema],
  notificationSent: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Booking', BookingSchema);
