const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Раздаем файлы из папки public
app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);

    // Создаем профиль нового игрока
    players[socket.id] = {
        id: socket.id,
        x: 0, y: 0, z: 0,
        rotation: 0,
        anim: 'idle',
        nickname: 'Игрок'
    };

    // Отправляем новому игроку инфу обо всех, кто уже на сервере
    socket.emit('currentPlayers', players);
    // Говорим всем остальным, что зашел новый игрок
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Принимаем никнейм
    socket.on('setNickname', (name) => {
        players[socket.id].nickname = name;
        io.emit('updateNickname', { id: socket.id, nickname: name });
    });

    // Синхронизация движения
    socket.on('playerMove', (data) => {
        players[socket.id].x = data.x;
        players[socket.id].z = data.z;
        players[socket.id].rotation = data.rotation;
        // Отправляем всем, кроме самого отправителя
        socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    // Синхронизация анимаций (дрочка)
    socket.on('playerAnim', (anim) => {
        players[socket.id].anim = anim;
        socket.broadcast.emit('playerAnimChanged', { id: socket.id, anim: anim });
    });

    // Синхронизация стрельбы
    socket.on('shoot', (data) => {
        socket.broadcast.emit('otherPlayerShoot', { 
            id: socket.id, 
            pos: data.pos, 
            dir: data.dir 
        });
    });

    // Отключение
    socket.on('disconnect', () => {
        console.log('Игрок отключился:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Fly.io использует порт 8080 по умолчанию
const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер работает на порту ${PORT}`);
});
