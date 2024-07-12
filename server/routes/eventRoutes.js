// routes/eventRoutes.js

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  const { date, time, level } = req.body;

  try {
    const newEvent = new Event({ date, time, level, participants: [] });
    await newEvent.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ success: false, message: 'Failed to add event' });
  }
});

router.delete('/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    await Event.findByIdAndDelete(eventId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

router.delete('/:eventId/participants/:participantId', async (req, res) => {
  const { eventId, participantId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: 'Event not found' });
    }

    event.participants.pull({ _id: participantId });
    await event.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing participant:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to remove participant' });
  }
});

module.exports = router;
