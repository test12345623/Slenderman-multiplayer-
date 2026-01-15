const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// This fixes the "Cannot GET /" error
app.get('/', (req, res) => {
    res.send('<h1>Slender Server is Online</h1>');
});

const io = new Server(server, {
    cors: {
        origin: "*", // Allows your local HTML file to connect
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Player joined:', socket.id);
    
    // Initialize player position
    players[socket.id] = { x: 0, y: 0, z: 0 };

    // Sync state
    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

    // Handle movement from clients
    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data;
            socket.broadcast.emit('playerMoved', { id: socket.id, pos: data });
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Running on port ${PORT}`));
