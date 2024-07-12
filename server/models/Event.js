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


const MONGO_URI =
  'mongodb+srv://jhezer1991:235a36a29a@alexinteractivecalendar.mpa6izo.mongodb.net/';
const BOT_TOKEN = '7302735948:AAGBs9jAgqr0yEUPzb_sjoz9piMXJB84G5w';
