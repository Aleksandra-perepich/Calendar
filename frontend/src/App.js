import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Добавим файл стилей

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
    <div className="app">
      <h1>Managment System</h1>
      <div className="level-select">
        <label>Select Level:</label>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <h2>Add New Date</h2>
      <div className="form-group">
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
          type="text"
          placeholder="Themes (comma separated)"
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
        />
        <button onClick={addBooking} disabled={loading}>
          Add Date
        </button>
      </div>
      <h2>Available Dates</h2>
      {loading ? (
        <div className="loader"></div>
      ) : (
        <ul className="bookings-list">
          {bookings.map((booking) => (
            <li key={booking._id} className="booking-item">
              <div className="booking-info">
                <span>{booking.date}</span>
                <span>{booking.time}</span>
                <span>{booking.themes.join(',')}</span>
                <button
                  onClick={() => deleteBooking(booking._id)}
                  disabled={loading}
                >
                  Delete Date
                </button>
              </div>
              <ul className="participants-list">
                {booking.participants.map((participant) =>
                  participant ? (
                    <li key={participant.id} className="participant-item">
                      <span>{participant.name || 'No name'}</span>
                      <span>Contact: {participant.phone || 'No phone'}</span>
                      <span>Theme: {participant.theme || 'No theme'}</span>
                      <button
                        onClick={() =>
                          deleteParticipant(booking._id, participant.id)
                        }
                        disabled={loading}
                      >
                        Remove Participant
                      </button>
                    </li>
                  ) : (
                    <li key={Math.random()} className="participant-item">
                      Participant data is missing
                    </li>
                  )
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
