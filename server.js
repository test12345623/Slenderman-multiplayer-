const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Allows the file on your computer to connect
});

let players = {};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    
    // Create a new player entry
    players[socket.id] = { x: 0, y: 0, z: 0 };

    // Send the list of players to the newcomer
    socket.emit('currentPlayers', players);

    // Tell others a new player joined
    socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

    // Handle movement updates
    socket.on('playerMovement', (movementData) => {
        players[socket.id] = movementData;
        socket.broadcast.emit('playerMoved', { id: socket.id, pos: movementData });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

// Port 443 is usually reserved for sudo/admin. 
// On most hosts, you listen on 8080 and the host "forwards" 443 to you.
const PORT = process.env.PORT || 443;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));