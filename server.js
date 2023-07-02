const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};

app.use(express.static('public'));
app.get('/main.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(__dirname + "/main.js");
});

io.on('connection', (socket) => {
    socket.on('message', (data) => {
        const packet = JSON.parse(data);

        if (packet.event === 'joinRoom') {
            let roomName = packet.data.roomName;
            let room = rooms[roomName];

            if (room && room.players.length >= 2) {
                socket.emit('roomFull');
                return;
            }
    
            if (!room) {
                rooms[roomName] = {
                    players: [],
                    state: {
                        score: [0, 0],
                        grid: Array.from({ length: 6 }, () => Array(7).fill(0))
                    }
                };

                room = rooms[roomName];
            }
    
            socket.join(roomName);
            room.players.push(socket.id);
    
            socket.emit('joinedRoom', roomName);
            
            if (room.players.length === 2) {
                io.to(roomName).emit('gameStart', room.state);
            }
        } else if (packet.event === "move") {
            const data = packet.data;
            const roomName = Object.keys(socket.rooms).find((r) => r !== socket.id);
            if( !roomName || !rooms[roomName] ) return;
    
            rooms[roomName].state[socket.id] = data;
            socket.to(roomName).emit('update', rooms[roomName].state);
        }
    });

    socket.on('disconnect', () => {
        const roomName = Object.keys(socket.rooms).find((r) => r !== socket.id);
        if (!roomName || !rooms[roomName]) return;
        const room = rooms[roomName];
        const playerIndex = room.players.indexOf(socket.id);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            delete room.state[socket.id];

            io.to(room.players[0]).emit('opponentDisconnected');
        }
    });
});

server.listen(80);