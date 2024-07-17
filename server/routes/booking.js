const express = require('express');
const Booking = require('../models/Booking');
const axios = require('axios');
const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN;

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
  const { date, time, level, userId, theme, phone, name, username } = req.body;

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

      // Отправка уведомления вам
      const message = `Новый участник на Speaking Club:\n\nИмя пользователя: @${username}\nТелефон: ${phone}\nУровень: ${level}\nДата: ${date}\nВремя: ${time}\nТема: ${theme}\n`;
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: '504424760', //send to DM
        text: message,
      });

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

router.post(`/sendTelegramMessage`, async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: '-1002189653449',
        text: message,
      }
    );
    res.status(200).send(response.data);
  } catch (error) {
    console.error(
      'Error sending message:',
      error.response ? error.response.data : error.message
    );
    res
      .status(error.response ? error.response.status : 500)
      .send(error.message);
  }
});

// Отправка сообщений участникам события
router.post('/notifyParticipants', async (req, res) => {
  const { bookingId, chosenTheme, additionalText } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const message = `Внимание! Предстоящий Speaking Club:\n\nДата: ${booking.date}\nВремя: ${booking.time}\nУровень: ${booking.level}\nТема: ${chosenTheme}\n\nСписок вопрос по теме:\n${additionalText}`;

    for (const participant of booking.participants) {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: participant.id,
        text: message,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
