const express = require('express');
const Booking = require('../models/Booking');
const router = express.Router();

// Получение всех записей
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получение свободных дат по уровню
router.get('/available', async (req, res) => {
  const { level } = req.query;

  try {
    const bookings = await Booking.find({ level });
    const available = bookings.filter(
      (booking) => booking.participants.length < 5
    );
    res.json(available);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Создание нового события
router.post('/create', async (req, res) => {
  const { date, time, level, themes } = req.body;

  try {
    let booking = await Booking.findOne({ date, time, level, themes });

    if (!booking) {
      booking = new Booking({ date, time, level, themes, participants: [] });
    }
    await booking.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Регистрация участника на событие
router.post('/', async (req, res) => {
  const { date, time, level, userId, theme, phone, name } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone is required' });
  }

  try {
    let booking = await Booking.findOne({ date, time, level });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.participants.length < 5) {
      booking.participants.push({ id: userId, theme, phone, name });
      await booking.save();
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Booking is full' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Удаление даты и всех связанных участников
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await booking.deleteOne();
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Удаление участника
router.delete('/:bookingId/participants/:userId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.participants = booking.participants.filter(
      (p) => p.id !== req.params.userId
    );
    await booking.save();
    res.json({ message: 'Participant removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
