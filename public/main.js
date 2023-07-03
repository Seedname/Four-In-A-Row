let cnv, s, s2, w, tile;
let lastStartTurn = 1;
let turn = 1;
let grid = Array.from({ length: 6 }, () => Array(7).fill(0))
let scores = [0, 0];
let counter = 0;
let room;
let player;
const socket = io();

function joinRoom(roomName) {
    const packet = {
        data: {
            roomName: roomName
        }
    };
    socket.emit('joinRoom', JSON.stringify(packet));
}

function makeMove(col) {
    const packet = {
        data: {
            roomName: room,
            column: col
        }
    };
    socket.emit('move', JSON.stringify(packet));
}


function setup() {
    createCanvas(document.body.clientWidth, window.innerHeight);

    background(245);
    cnv = createGraphics(width, height);
    cnv.noStroke();
    cnv.fill(150, 150, 150);
    cnv.rectMode(CENTER, CENTER);
    w = width/2;
    s2 = w/7;
    s = s2-40*width/1707;
    cnv.stroke(50, 50, 50);
    cnv.strokeWeight(20*width/1707);
    cnv.rect(width/2, height/2, w, 6/7*w);
    cnv.noStroke();

    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 6; j++) {
            cnv.erase()
            cnv.circle(width/2-3*s2+s2*i, height/2-2.5*s2+s2*j, s, s);        
        }
    }
    const currentPath = window.location.pathname;
    joinRoom(currentPath);
}

socket.on('joinedRoom', (data) => {
    room = data[0];
    player = data[1];
});

socket.on('gameStart', (data) => {
    scores = data.score;
    lastStartTurn = data.lastStartTurn;
    counter = data.counter;
    grid = data.grid;
    turn = 1;
});

socket.on('update', (data) => {
    turn = data[1];
    tile = new Tile(data[0], 0, grid, turn);
});

socket.on('opponentDisconnected', (data) => {
    console.log(opponentDisconnected);
});

var win = false;
var ways = [];


socket.on('gameOver', (data) => {
    win = true;
    ways = data[0]; 
});


function draw() {
    background(245);

    noStroke();
    for (let i = 0; i < 7; i++) {
        let x = width/2-3*s2+s2*i;
        if (mouseX >= x-s2/2 && mouseX <= x+s2/2) {
            fill(200, 200, 200);
            rectMode(CENTER, CENTER);
            rect(x, height/2, s2, 6/7*w);
        }
        for (var j = 0; j < 6; j++) {
            if (grid[j][i] == 1) {
                fill(255, 0, 0);
                circle(width/2-3*s2+s2*i, height/2-2.5*s2+s2*j, s, s);
            } else if (grid[j][i] == 2) {
                fill(0, 0, 255);
                circle(width/2-3*s2+s2*i, height/2-2.5*s2+s2*j, s, s);
            }
        }

    }

    if (tile && !tile.finished) {
        tile.display(win, ways);
    } 

    image(cnv, 0, 0);

    if(win) {
        textAlign(CENTER, CENTER);
        textSize(60);
        if (turn == 1) {
            fill(100, 0, 0);
            text("Red Wins!", width/2, height/2);
        } else if (turn == 2) {
            fill(0, 0, 100);
            text("Blue Wins!", width/2, height/2);
        }

        noFill();
        for (let i = 0; i < ways.length; i++) {
            stroke(100, 0, 0);
            if (turn == 2) {
                stroke(0, 0, 100);
            }
            strokeWeight(5);
            for (let j = 0; j < 4; j++) {
                circle(width/2-3*s2+s2*round(ways[i][j][1]), height/2-2.5*s2+s2*round(ways[i][j][0]), s, s);
            }
            stroke(0);
            strokeWeight(10);
            line(width/2-3*s2+s2*ways[i][0][1], height/2-2.5*s2+s2*ways[i][0][0], width/2-3*s2+s2*ways[i][3][1], height/2-2.5*s2+s2*ways[i][3][0]);
        }
    } else if (counter >= 42) {
        textAlign(CENTER, CENTER);
        textSize(60);
        fill(0, 0, 0);
        text("Draw", width/2, height/2);
    }

    noStroke();

    textAlign(CENTER, CENTER);
    textSize(50);
    fill(0, 0, 255);
    text(scores[1], 50, 50);

    textAlign(CENTER, CENTER);
    textSize(50);
    fill(255, 0, 0);
    text(scores[0], width-50, 50);

    noFill();
    stroke(0);
    strokeWeight(3);

    if (turn == 1) {
        ellipse(50, 46.5, 50, 50);
    } else if (turn == 2) {
        ellipse(width-50, 46.5, 50, 50);
    }
}

function mouseReleased() {
    // if (win || counter >= 42) {
    //     grid = Array.from({ length: 6 }, () => Array(7).fill(0));
        
    //     if (lastStartTurn == 1) {
    //         lastStartTurn = 2;
    //         turn = 2;
    //     } else if (lastStartTurn == 2) {
    //         lastStartTurn = 1;
    //         turn = 1;
    //     }
    //     win = false;
    //     ways = [];
    //     tile = null;
    //     counter = 0;
    // } else if (turn == 1 && !tile || tile.finished) {
    if (turn == player) {
        for (let i = 0; i < 7; i++) {
            if (grid[0][i] == 0) {
                let x = width/2-3*s2+s2*i;
                if (mouseX >= x-s2/2 && mouseX <= x+s2/2) {
                    makeMove(i);
                    // turn += 1;
                    // if (turn > 2) { turn = 1; } 

                    // tile = new Tile(i, 0, grid, turn);
                    // counter += 1;
                    break; 
                }
            }
        }
    }  
}