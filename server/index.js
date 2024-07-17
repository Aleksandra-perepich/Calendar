require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bookingRoutes = require('./routes/booking');
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const cors = require('cors');
const cron = require('node-cron');
const Booking = require('./models/Booking');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 5000;
const URL = process.env.URL; // URL вашего сервера

// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// app.use(cors());

app.use(
  cors({
    origin: 'https://calendar-tawny-ten.vercel.app',
  })
);

app.use(express.json());
app.use('/api/bookings', bookingRoutes);

const bot = new Telegraf(BOT_TOKEN);

// Настройка webhook
bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));
const CHAT_ID = '-1002189653449';

// Cron-задача для отправки уведомлений за час до события
const SERVER_TIMEZONE = 'Europe/Moscow'; // замените на ваш часовой пояс

cron.schedule('*/30 * * * *', async () => {
  try {
    // Текущее местное время
    const nowLocal = moment.tz(SERVER_TIMEZONE);
    // Время через час в местном времени
    const oneHourLaterLocal = nowLocal.clone().add(1, 'hours');

    // Преобразование местного времени в формат UTC для поиска в базе данных
    const nowUtc = nowLocal.clone().utc();
    const oneHourLaterUtc = oneHourLaterLocal.clone().utc();

    // Форматирование даты и времени для поиска
    // const currentDate = nowUtc.format('YYYY-MM-DD');
    // const currentTime = nowUtc.format('HH:mm');
    // const oneHourLaterTime = oneHourLaterUtc.format('HH:mm');

    const currentDate = nowLocal.format('YYYY-MM-DD');
    const currentTime = nowLocal.format('HH:mm');
    const oneHourLaterTime = oneHourLaterLocal.format('HH:mm');

    console.log(`Текущая дата и время (местное): ${nowLocal.format()}`);
    console.log(`Текущая дата и время (UTC): ${nowUtc.format()}`);
    console.log(
      `Ищем события на дату: ${currentDate} и время: до ${oneHourLaterTime}`
    );

    // Поиск событий, которые начнутся через час или меньше и уведомления для которых еще не были отправлены
    const bookings = await Booking.find({
      date: currentDate,
      time: {
        $gte: currentTime,
        $lte: oneHourLaterTime,
      },
      notificationSent: false,
    });

    console.log(`Найдено событий: ${bookings.length}`);

    // Отправка уведомлений
    bookings.forEach(async (booking) => {
      const message = `Speaking Club уровень ${booking.level} состоится ${booking.date} ${booking.time}`;
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID, // Замените на ваш chat_id
        text: message,
      });

      // Обновление поля notificationSent
      booking.notificationSent = true;
      await booking.save();
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
});

// Переменные для хранения состояния пользователя
const userState = {};

bot.start((ctx) => {
  userState[ctx.from.id] = { name: ' ', step: 'chooseLevel' };

  ctx.reply(
    'Привет! Рад вас видеть в нашем клубе английского языка!\n\nПожалуйста, выберите уровень вашего владения английским языком \n\n/beginner, /intermediate, /advanced'
    // Как я могу к вам обращаться?'
  );
});

const levels = ['beginner', 'intermediate', 'advanced'];

levels.forEach((level) => {
  bot.command(level, async (ctx) => {
    if (!userState[ctx.from.id]) {
      ctx.reply('Пожалуйста, начните с команды /start');
      return;
    }

    const response = await axios.get(
      `${process.env.REACT_APP_SERVER_URL}/api/bookings/available`,
      {
        params: { level },
      }
    );

    if (response.data.length > 0) {
      const availableDates = response.data.map((booking) => ({
        text: `${booking.date} ${booking.time}`,
        callback_data: `date_${booking.date}_${booking.time}_${level}`,
      }));

      ctx.reply(
        `Доступные даты для уровня ${level}:`,
        Markup.inlineKeyboard(availableDates.map((date) => [date]))
      );

      userState[ctx.from.id] = {
        ...userState[ctx.from.id],
        level,
        step: 'chooseDate',
        availableDates: response.data,
      };
    } else {
      ctx.reply(`Нет свободных дат для уровня ${level}.`);
    }
  });
});

bot.on('callback_query', async (ctx) => {
  const state = userState[ctx.from.id];
  if (!state) {
    ctx.reply('Пожалуйста, начните с команды /start');
    return;
  }

  const [type, date, time, level] = ctx.callbackQuery.data.split('_');

  if (type === 'date') {
    const chosenDate = state.availableDates.find(
      (booking) => booking.date === date && booking.time === time
    );

    if (chosenDate) {
      const themes = chosenDate.themes.map((theme) => ({
        text: theme,
        callback_data: `theme_${theme}_${date}_${time}_${level}`,
      }));

      ctx.reply(
        'Выберите подходящую тему:',
        Markup.inlineKeyboard(themes.map((theme) => [theme]))
      );

      userState[ctx.from.id] = {
        ...state,
        date,
        time,
        step: 'chooseTheme',
        themes: chosenDate.themes,
      };
    }
  } else if (type === 'theme') {
    const theme = date; // Здесь date будет темой, так как в callback_data она передается в первом элементе после type
    const bookingDate = time; // Здесь time будет датой
    const bookingTime = level; // Здесь level будет временем
    const bookingLevel = ctx.callbackQuery.data.split('_')[4]; // Здесь извлекается уровень

    if (state.themes.includes(theme)) {
      userState[ctx.from.id] = {
        ...state,
        theme,
        date: bookingDate,
        time: bookingTime,
        level: bookingLevel,
        step: 'enterPhone',
      };
      ctx.reply('Укажите свой контактный номер или имя в ТГ');
    }
  }
});

bot.on('text', async (ctx) => {
  if (!userState[ctx.from.id]) {
    ctx.reply(
      'Пожалуйста выберите уровень: /beginner, /intermediate, /advanced'
    );
    return;
  }

  const state = userState[ctx.from.id];
  if (!state) {
    ctx.reply('Пожалуйста, начните с команды /start');
    return;
  }

  switch (state.step) {
    // case 'enterName':
    //   userState[ctx.from.id] = {
    //     ...state,
    //     name: ctx.message.text,
    //     step: 'chooseLevel',
    //   };
    //   ctx.reply(
    //     'Пожалуйста, выберите уровень вашего владения английским языком \n\n/beginner, /intermediate, /advanced'
    //   );
    //   break;

    case 'enterPhone':
      const { date, time, level, theme, name } = state;
      const phone = ctx.message.text;
      const username = ctx.from.username || 'Не указано';

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_SERVER_URL}/api/bookings`,
          {
            date,
            time,
            level,
            theme,
            phone,
            name,
            userId: ctx.from.id,
            username,
          }
        );

        if (response.data.success) {
          ctx.reply(
            'Поздравляю, вы успешно зарегистрировались на speaking club!'
          );
        } else {
          ctx.reply(response.data.message);
        }
      } catch (error) {
        console.error(error);
        ctx.reply('Упс, что-то пошло не по плану.');
      }

      delete userState[ctx.from.id];
      break;

    default:
      ctx.reply(
        'Пожалуйста представьтесь или выберите уровень: /beginner, /intermediate, /advanced'
      );
  }
});

bot
  .launch()
  .then(() => console.log('Bot launched'))
  .catch((err) => {
    if (err.response && err.response.error_code === 409) {
      console.log('Bot already running');
    } else {
      console.error('Error launching bot:', err);
    }
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
