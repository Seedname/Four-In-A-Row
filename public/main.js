let cnv, s, s2, w, tile, room, player;
let lastStartTurn = 1;
let turn = 1;
let grid = Array.from({ length: 6 }, () => Array(7).fill(0))
let scores = [0, 0];
let counter = 0;
let gameStarted = false;
let tie = false;
var win = false;
var ways = [];
const currentPath = window.location.pathname.substring(1);

const socket = io();

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

    if (currentPath !== "") socket.emit('joinRoom', currentPath);
}

function windowResized() {
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
}

socket.on('noRoom', () => {
    window.location.replace("/");

});
socket.on('roomFull', () => {
    window.location.replace("/");
}); 

socket.on('createRoom', (data) => {
    window.location.replace(data);
});

socket.on('joinedRoom', (data) => {
    room = data[0];
    player = data[1];
});

socket.on('gameStart', (data) => {
    scores = data.score;
    lastStartTurn = data.lastStartTurn;
    counter = data.counter;
    grid = data.grid;
    gameStarted = true;
    turn = 1;
});

socket.on('update', (data) => {
    turn = data[1];
    tile = new Tile(data[0], height/2-4.5*s2, grid, turn);
});

socket.on('opponentDisconnected', (data) => {
    grid = Array.from({ length: 6 }, () => Array(7).fill(0));
    turn = 1;
    player = 1;
    scores = [0, 0];
    win = false;
    ways = [];
    tile = null;
    counter = 0;
    gameStarted = false;
});

socket.on('gameOver', (data) => {
    if (!tile.finished) {
        tile.won(data[0], data[1]);
    } else {
        win = true;
        ways = data[0]; 
        scores = data[1];
    }
});

socket.on('tie', () => { tie = true });

socket.on('reset', (data) => {
    grid = Array.from({ length: 6 }, () => Array(7).fill(0));
    turn = data;
    win = false;
    ways = [];
    tile = null;
    counter = 0;
    tie = false;
});

function insideRect(x, y, w, h) { return mouseX >= x && mouseX <= x+w && mouseY >= y && mouseY <= y+h; }

function draw() {
    background(245);

    if (currentPath === "") {
        textAlign(CENTER, CENTER);
        textSize(80);
        fill(0, 0, 255);
        text("Four in a Row", width/2, height/4);
        rectMode(CORNER);
        fill(255, 0, 0);
        noStroke();
        if (insideRect(width/2-250/2, height/2-75/2, 250, 75) ) fill(128, 0, 0);
        rect(width/2-250/2, height/2-75/2, 250, 75);
        fill(0);
        textSize(40);
        text("Create Room", width/2, height/2)
        return;
    } 

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
    } else if (tie) {
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

    if (gameStarted) {
        textAlign(CENTER, CENTER);
        textSize(50);
        fill(255, 0, 0);
        text(scores[0], width-50, 50);
    } else {
        textAlign(RIGHT, TOP);
        textSize(30);
        fill(255, 0, 0);
        text("Waiting on player...", width-50, 50);
    }

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
    if (currentPath === "" && insideRect(width/2-250/2, height/2-75/2, 250, 75) ) {
        socket.emit('createRoom');
    }
    if (currentPath === "") return;
    if ((win || tie) && player === 1) {
        socket.emit('reset', room);
    } else if (!win && !tie && gameStarted && turn === player) {
        for (let i = 0; i < 7; i++) {
            if (grid[0][i] == 0) {
                let x = width/2-3*s2+s2*i;
                if (mouseX >= x-s2/2 && mouseX <= x+s2/2) {
                    const data = {
                        roomName: room,
                        column: i
                    };
                    socket.emit('move', data);
                    break; 
                }
            }
        }
    }  
}