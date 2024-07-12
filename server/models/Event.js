// models/Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  participants: [
    {
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
  ],
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
