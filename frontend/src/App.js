import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [level, setLevel] = useState('beginner');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bookings, setBookings] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [themes, setThemes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deployResponse, setDeployResponse] = useState('');
  const [telegramResponse, setTelegramResponse] = useState('');
  const [deployLoading, setDeployLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [chosenTheme, setChosenTheme] = useState('');
  const [additionalText, setAdditionalText] = useState('');

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

  const triggerDeploy = async () => {
    setDeployLoading(true);
    try {
      const response = await axios.post(
        'https://api.render.com/deploy/srv-cq8kq156l47c73cvujj0?key=uteeLI_6RkA'
      );
      setDeployResponse(
        `Deploy triggered successfully: ${JSON.stringify(response.data)}`
      );
    } catch (error) {
      setDeployResponse(`Failed to trigger deploy: ${error.message}`);
    } finally {
      setDeployLoading(false);
    }
  };

  const sendMessageToTelegram = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/bookings/sendTelegramMessage`,
        {
          message,
        }
      );
      setTelegramResponse(response.data.message);
    } catch (error) {
      setTelegramResponse(`Failed to send message: ${error.message}`);
    }
  };

  const handleNotify = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/bookings/notifyParticipants`,
        {
          bookingId: selectedBooking,
          chosenTheme,
          additionalText,
        }
      );
      alert('Сообщения успешно отправлены участникам.');
    } catch (err) {
      console.error(err);
      alert('Ошибка при отправке сообщений.');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Booking System</h1>
        <button
          className="deploy-button"
          onClick={triggerDeploy}
          disabled={deployLoading}
        >
          {deployLoading ? 'Deploying...' : 'Trigger Deploy'}
        </button>
        {/* <p>{deployResponse}</p> */}
      </header>
      <main>
        <section className="controls">
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <div className="add-booking">
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
              type="text"
              value={themes}
              onChange={(e) => setThemes(e.target.value)}
              placeholder="Themes (comma separated)"
            />
            <button onClick={addBooking}>Add Date</button>
          </div>
        </section>

        <section className="controls">
          <h2>Уведомление участников события</h2>
          <select
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
          >
            <option value="">Выберите событие</option>
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.date} {booking.time} - {booking.level}
              </option>
            ))}
          </select>
          {selectedBooking && (
            <>
              <h3>Темы</h3>
              {bookings
                .find((booking) => booking._id === selectedBooking)
                .themes.map((theme, index) => (
                  <div key={index} className="radio-section">
                    <span>{theme}</span>
                    <input
                      type="radio"
                      name="theme"
                      value={theme}
                      onChange={(e) => setChosenTheme(e.target.value)}
                    />
                  </div>
                ))}
              <textarea
                placeholder="Список вопрос по теме"
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
              />
              <button onClick={handleNotify}>Отправить уведомления</button>
            </>
          )}
        </section>

        <section className="bookings">
          <h2>Available Dates</h2>
          {loading ? (
            <div className="loader"></div>
          ) : (
            <ul>
              {bookings.map((booking) => (
                <li key={booking._id}>
                  {booking.date} {booking.time} {booking.themes.join(', ')}
                  <button onClick={() => deleteBooking(booking._id)}>
                    Delete Date
                  </button>
                  <ul>
                    {booking.participants.map((participant) => (
                      <li key={participant.id}>
                        {participant.username || ' '}{' '}
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
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="telegram">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here"
          />
          <button onClick={sendMessageToTelegram}>Send to Telegram</button>
          <p>{telegramResponse}</p>
        </section>
      </main>
    </div>
  );
}

export default App;
