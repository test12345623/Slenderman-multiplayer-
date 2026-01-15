const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// FIX: This tells the browser what to show when you visit the URL
app.get('/', (req, res) => {
    res.send('<h1>Slender Multiplayer Server is Running</h1><p>Connect via your game client.</p>');
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    players[socket.id] = { x: 0, y: 0, z: 0 };
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id] = movementData;
            socket.broadcast.emit('playerMoved', { id: socket.id, pos: movementData });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is live on port ${PORT}`);
});
