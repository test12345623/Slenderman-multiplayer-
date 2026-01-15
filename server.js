const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
// CORS is set to "*" so your local HTML file can connect to the Render server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// This object stores all active players
// Format: { "socketId": { x: 0, y: 0, z: 0 } }
let players = {};

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // 1. Create a new player entry
    players[socket.id] = { x: 0, y: 0, z: 0 };

    // 2. Send the current list of players to the new player
    socket.emit('currentPlayers', players);

    // 3. Tell everyone else a new player has joined
    socket.broadcast.emit('newPlayer', { id: socket.id, pos: players[socket.id] });

    // 4. Handle Movement Updates
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;

            // Broadcast the movement to all other players
            socket.broadcast.emit('playerMoved', { id: socket.id, pos: players[socket.id] });
        }
    });

    // 5. Handle Disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        // Tell everyone to remove this player's character
        io.emit('playerDisconnected', socket.id);
    });
});

// Render will automatically provide a PORT environment variable.
// If it's not there, it defaults to 443 (though 443 requires admin rights locally).
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Slender Server is running on port ${PORT}`);
});
