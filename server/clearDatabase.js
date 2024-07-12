const mongoose = require('mongoose');
const Booking = require('./models/Booking');

const MONGO_URI =
  'mongodb+srv://jhezer1991:235a36a29a@alexinteractivecalendar.mpa6izo.mongodb.net/';
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    return Booking.deleteMany({});
  })
  .then(() => {
    console.log('Database cleared');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('Error clearing database', err);
    mongoose.connection.close();
  });
