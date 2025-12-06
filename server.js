const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.IO для Render (ВАЖНО!)
const io = socketIO(server, {
  cors: {
    origin: "*", // Разрешаем все домены
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'], // Обязательно!
  pingTimeout: 60000, // Увеличиваем таймаут для Render
  pingInterval: 25000
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API статус (для проверки)
app.get('/api/status', (req, res) => {
  res.json({ 
    status: '✅ Chatterfly работает на Render!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Socket.IO подключения
io.on('connection', (socket) => {
  console.log('Новое подключение:', socket.id);
  
  socket.on('register', (userData) => {
    socket.emit('registered', {
      success: true,
      user: {
        id: socket.id,
        name: userData.name || 'Гость',
        username: userData.username || `user_${socket.id.slice(0, 6)}`
      }
    });
  });
  
  socket.on('message', (data) => {
    io.emit('message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Отключение:', socket.id);
  });
});

// Все остальные запросы → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера для Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Chatterfly запущен на Render!`);
  console.log(`🌐 Порт: ${PORT}`);
  console.log(`📡 WebSocket готов к подключениям`);
});