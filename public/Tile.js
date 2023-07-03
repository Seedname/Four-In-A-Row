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

class Tile {
    constructor(i, y, grid, turn) {
        const w = width/2;
        const s2 = w/7;
        const s = s2-40*width/1707;

        this.finished = false;
        this.turn = turn;
        this.i = i;
        this.x = width/2-3*s2+s2*i;
        this.y = y;
        this.vy = 2;
        this.ay = 3;
        this.s = s;

        this.updateWin = false;

        this.grid = grid;
        this.highestJ = 5;
        for (let j = 0; j < 6; j++) {
            if (this.grid[j][i] != 0) {
                this.highestJ = j-1;
                break;
            }
        }

        this.highestY = height/2-2.5*s2+s2*this.highestJ;
    }

    won(ways, scores) {
        this.updateWin = true;
        this.ways = ways;
        this.scores = scores;
    }

    display() {
        if (this.y < this.highestY - this.vy) {
            this.vy += this.ay;
            this.y += this.vy;
        } else {
            this.y = this.highestY;
            this.grid[this.highestJ][this.i] = this.turn;
            this.finished = true;
            socket.emit('ready', room);
            if (this.updateWin) {
                win = true;
                ways = this.ways;
                scores = this.scores;
            }
        }

        if (this.turn == 1) {
            fill(255, 0, 0);
        } else if (this.turn == 2) {
            fill(0, 0, 255);
        }
        ellipse(this.x, this.y, this.s, this.s);
        
    }
}