const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};

app.use(express.static('public'));
app.get("/:roomCode", (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')) });

function checkWin(turn, grid) {
    let ways = [];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] == turn && grid[i][j+1] == turn && grid[i][j+2] == turn && grid[i][j+3] == turn) {
                ways.push([[i,j-0.25], [i,j+1], [i,j+2], [i,j+3.25]]);
            }
        }
    }
    for (let i = 0; i < 3; i++) {
        for (j = 0; j < 7; j++) {
            if (grid[i][j] == turn && grid[i+1][j] == turn && grid[i+2][j] == turn && grid[i+3][j] == turn) {
                ways.push([[i-0.25,j], [i+1,j], [i+2,j], [i+3.25,j]]);
            }
        }
    }
    for (let i = 3; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] == turn && grid[i-1][j+1] == turn && grid[i-2][j+2] == turn && grid[i-3][j+3] == turn) {
                ways.push([[i+0.25,j-0.25], [i-1,j+1], [i-2,j+2], [i-3.25,j+3.25]]);
            }
        }
    }
    for (let i = 3; i < 6; i++) {
        for (let j = 3; j < 7; j++) {
            if (grid[i][j] == turn && grid[i-1][j-1] == turn && grid[i-2][j-2] == turn && grid[i-3][j-3] == turn) {
                ways.push([[i+0.25,j+0.25], [i-1,j-1], [i-2,j-2], [i-3.25,j-3.25]]);
            }
        }
    }

    return ways;
}

io.on('connection', (socket) => {
    socket.on('joinRoom', (data) => {
        const roomName = data;
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
                    ready: [true, true],
                    lastStartTurn: 1,
                    turn: 1,
                    counter: 0,
                    grid: Array.from({ length: 6 }, () => Array(7).fill(0))
                }
            };

            room = rooms[roomName];
        }
        
        socket.join(roomName);
        room.players.push(socket.id);

        socket.emit('joinedRoom', [roomName, room.players.length]);
        // io.to(roomName).emit('joinedRoom', roomName);
        
        if (room.players.length === 2) {
            io.to(roomName).emit('gameStart', room.state);
        }
    });

    socket.on('move', (data) => {
        const roomName = data.roomName;

        if ( !roomName || !rooms[roomName] ) return;
        if ( !rooms[roomName].players.includes(socket.id) ) return;

        const room = rooms[roomName];
        if ( room.players.length !== 2 ) return;
        const state = room.state;
        
        if ( !state.ready[0] || !state.ready[1] ) return;
        if ( socket.id !== room.players[state.turn-1] ) return;

        state.ready.fill(false);
        state.turn ++;
        if (state.turn > 2) { state.turn = 1; } 

        let highestJ = 5;
        for (let j = 0; j < 6; j++) {
            if (state.grid[j][data.column] != 0) {
                highestJ = j-1;
                break;
            }
        }
        state.counter ++;
        state.grid[highestJ][data.column] = state.turn;
        const result = checkWin(state.turn, state.grid);

        if (result.length > 0) {
            state.score[state.turn-1] += 1;
            io.to(roomName).emit('update', [data.column, state.turn]);
            io.to(roomName).emit('gameOver', [result, state.score]);
            return;
        }

        if (state.counter === 42) {
            io.to(roomName).emit('update', [data.column, state.turn]);
            io.to(roomName).emit('tie');
            return;
        }

        io.to(roomName).emit('update', [data.column, state.turn]);
    });

    socket.on('reset', (roomName) => {

        if ( !roomName || !rooms[roomName] ) return;

        const room = rooms[roomName];

        if (socket.id !== room.players[0]) return;

        const state = room.state;

        state.grid = Array.from({ length: 6 }, () => Array(7).fill(0));
        
        if (state.lastStartTurn == 1) {
            state.lastStartTurn = 2;
            state.turn = 2;
        } else if (state.lastStartTurn == 2) {
            state.lastStartTurn = 1;
            state.turn = 1;
        }
        state.counter = 0;

        io.to(roomName).emit('reset', state.turn);
    });

    socket.on('ready', (roomName) => {
        if ( !roomName || !rooms[roomName] ) return;
        const index = rooms[roomName].players.indexOf(socket.id);
        if ( index < 0 ) return;
        
        const room = rooms[roomName];
        const state = room.state;
        state.ready[index] = true;
    });

    socket.on('disconnect', () => {
        const roomName = Object.keys(rooms).find((r) => r !== socket.id);
        if (!roomName || !rooms[roomName]) return;

        const room = rooms[roomName];
        const playerIndex = room.players.indexOf(socket.id);
        if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            if (room.players.length === 0) {
                delete rooms[roomName];
                return;
            }

            room.state = {
                score: [0, 0],
                ready: [true, true],
                lastStartTurn: 1,
                turn: 1,
                counter: 0,
                grid: Array.from({ length: 6 }, () => Array(7).fill(0))
            };
            io.to(room.players[0]).emit('opponentDisconnected');
        }
    });
});

server.listen(8080);