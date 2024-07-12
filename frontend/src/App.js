import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [level, setLevel] = useState('beginner');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bookings, setBookings] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [themes, setThemes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings(level);
  }, [level]);

  const fetchBookings = async (level) => {
    setLoading(true);
    const response = await axios.get(
      `${process.env.REACT_APP_SERVER_URL}/api/bookings/available`,
      {
        params: { level },
      }
    );
    setBookings(response.data);
    setLoading(false);
  };

  const addBooking = async () => {
    setLoading(true);
    await axios.post(
      `${process.env.REACT_APP_SERVER_URL}/api/bookings/create`,
      {
        date: newDate,
        time: newTime,
        level,
        themes: themes.split(','),
        // userId: '1',
        // email: '1',
        // phone: 1,
      }
    );
    fetchBookings(level);
    setLoading(false);
  };

  const deleteBooking = async (id) => {
    setLoading(true);
    await axios.delete(
      `${process.env.REACT_APP_SERVER_URL}/api/bookings/${id}`
    );
    fetchBookings(level);
    setLoading(false);
  };

  const deleteParticipant = async (bookingId, userId) => {
    setLoading(true);
    await axios.delete(
      `${process.env.REACT_APP_SERVER_URL}/api/bookings/${bookingId}/participants/${userId}`
    );
    fetchBookings(level);
    setLoading(false);
  };

  return (
    <div>
      <h1>Booking System</h1>
      <select value={level} onChange={(e) => setLevel(e.target.value)}>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
      <h2>Add New Date</h2>
      <input
        type="date"
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
      />
      <input
        type="time"
        value={newTime}
        onChange={(e) => setNewTime(e.target.value)}
      />
      <input
        type="string"
        value={themes}
        onChange={(e) => setThemes(e.target.value)}
      />
      <button onClick={addBooking}>Add Date</button>
      <h2>Available Dates</h2>
      {loading ? (
        <span class="loader"></span>
      ) : (
        <ul>
          {bookings.map((booking) => (
            <li key={booking._id}>
              {booking.date} {booking.time} {booking.themes}
              <button onClick={() => deleteBooking(booking._id)}>
                Delete Date
              </button>
              <ul>
                {booking.participants.map((participant) => {
                  if (participant) {
                    return (
                      <li key={participant.id}>
                        {participant.name || 'No name'}{' '}
                        {participant.phone || 'No phone'}{' '}
                        {participant.theme || 'No theme'}
                        <button
                          onClick={() =>
                            deleteParticipant(booking._id, participant.id)
                          }
                        >
                          Remove Participant
                        </button>
                      </li>
                    );
                  } else {
                    return (
                      <li key={Math.random()}>Participant data is missing</li>
                    );
                  }
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
