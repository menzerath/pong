// game-size
var gameWidth = window.innerWidth;
var gameHeight = window.innerHeight;

// paddle-size
var paddleWidth = 20;
var paddleHeight = 100;

// some keys
var keyQ = 81;
var keyA = 65;
var keyArrowUp = 38;
var keyArrowDown = 40;
var keyEscape = 27;

// game
var canvas;
var ctx;
var keyPressed = [];

// game-elements
var useAi = false;
var paused = true;
var score = [0, 0];
var sound = ["assets/sound1.ogg", "assets/sound2.ogg"];

var playerA = {
    x: null,
    y: null,

    update: function() {
        if (keyPressed[keyQ]) this.y -= 15;
        if (keyPressed[keyA]) this.y += 15;

        // Paddle has to be inside the canvas
        this.y = Math.max(Math.min(this.y, gameHeight - paddleHeight), 0);
    },

    draw: function() {
        ctx.fillRect(this.x, this.y, paddleWidth, paddleHeight);
    }
};

var playerB = {
    x: null,
    y: null,

    update: function() {
        if (useAi) {
            // best position: middle of paddle = middle of ball
            var pos = ball.y - ((paddleHeight - ball.side) / 2);

            // move to this position (not too fast!)
            this.y += (pos - this.y) / 9;

            // Paddle has to be inside the canvas
            this.y = Math.max(Math.min(this.y, gameHeight - paddleHeight), 0);
        } else {
            if (keyPressed[keyArrowUp]) this.y -= 15;
            if (keyPressed[keyArrowDown]) this.y += 15;

            // Paddle has to be inside the canvas
            this.y = Math.max(Math.min(this.y, gameHeight - paddleHeight), 0);
        }
    },

    draw: function() {
        ctx.fillRect(this.x, this.y, paddleWidth, paddleHeight);
    }
};

var ball = {
    x:   null,
    y:   null,
    vel: null,

    side:  20,
    speed: 15,

    serve: function(side) { // 0 --> Player A | 1 --> Player B
        // set the x and y position
        if (side === 0) {
            this.x = playerA.x + paddleWidth;
            this.y = playerA.y + paddleHeight / 2 - this.side / 2;
        } else {
            this.x = playerB.x - this.side;
            this.y = playerB.y + paddleHeight / 2 - this.side / 2;
        }

        // get a random ball-out-angle
        var phi = (Math.PI / 2) * (1 - 2 * Math.random());

        // set velocity direction and magnitude
        this.vel = {
            x: (side === 0 ? -1 : 1) * this.speed * Math.cos(phi),
            y: this.speed * Math.sin(phi)
        }
    },

    update: function() {
        // update position with current velocity
        this.x += this.vel.x;
        this.y += this.vel.y;

        // do not let ball out of the game-canvas (--> mirror direction)
        if (this.y < 0 || this.y + this.side > gameHeight) {
            // mirror y-velocity
            this.vel.y *= -1;

            // make sure the ball can not go out of the canvas
            if (this.y < 0) this.y = 0;
            if (this.y + this.side > gameHeight) this.y = gameHeight - this.side;

            playSound(sound[0]);
        }

        // check collision with paddle in x direction
        var paddle = this.vel.x < 0 ? playerA : playerB;
        if (paddle.x < this.x + this.side && paddle.y < this.y + this.side && this.x < paddle.x + paddleWidth && this.y < paddle.y + paddleHeight) {
            // mirror x-velocity
            this.vel.x *= -1;

            // set the x position and calculate reflection angle
            var n = (this.y + this.side - paddle.y) / (paddleHeight + this.side);
            var phi = (Math.PI / 4) * (2 * n - 1); // pi/4 = 45

            // calculate smash value and update velocity
            var smash = Math.abs(phi) > 0.2 * Math.PI ? 1.5 : 1;
            this.vel.x = smash * (paddle === playerA ? 1 : -1) * this.speed * Math.cos(phi);
            this.vel.y = smash * this.speed * Math.sin(phi);

            playSound(sound[0]);
        }

        // reset the ball when ball outside of the canvas in the x direction
        if (this.x + this.side < 0 || this.x > gameWidth) {
            if (this.x > gameWidth) { ++score[0]; } else { ++score[1]; }
            playSound(sound[1]);
            this.serve(paddle === playerA ? 0 : 1);
        }
    },

    draw: function() {
        ctx.fillRect(this.x, this.y, this.side, this.side);
    }
};

function playSound(file) {
    new Audio(file).play();
}

function isInt(value) {
  return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function main() {
    // game-canvas
    canvas = document.getElementById("game");
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    ctx = canvas.getContext("2d");

    // key-event-listener
    document.addEventListener("keydown", function(evt) {
        keyPressed[evt.keyCode] = true;
    });
    document.addEventListener("keyup", function(evt) {
        keyPressed[evt.keyCode] = false;

        if (evt.keyCode === keyEscape) { paused = !paused; }
    });

    init(); // initiate game objects
    draw(); // draw once

    // play agains a real person or the computer
    useAi = !confirm("Play against a second Player next to you?\nOtherwise you will play against the Computer...");

    // custom ball-speed
    var ballSpeed = prompt("Do you want to use a custom ball-speed?\nIt has to be between 1 and 50.", "15");
    if (isInt(ballSpeed) && ballSpeed > 0 && ballSpeed <= 50) {
        ball.speed = ballSpeed;
    }

    // serve first ball
    ball.serve(getRandomInt(0, 1));

    // game loop function
    var loop = function() {
        window.requestAnimationFrame(loop, canvas);

        update();
        draw();
    };
    window.requestAnimationFrame(loop, canvas);
}

function init() {
    // set initial paddle-positions
    playerA.x = 0;
    playerA.y = (gameHeight - paddleHeight)/2;

    playerB.x = gameWidth - paddleWidth;
    playerB.y = (gameHeight - paddleHeight)/2;
}

function update() {
    if (paused) return;

    playerA.update();
    playerB.update();
    ball.update();
}

function draw() {
    // canvas background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // set background color
    ctx.fillStyle = "#fff"; // white
    if (paused) ctx.fillStyle = "#424242"; // grey (if paused for a darker background)

    // net in the middle (--> many small rectangles)
    var w = 5; // width
    var x = (gameWidth - w) / 2; // x pos
    var y = 0; // y pos
    var step = gameHeight / 20; // how many segments
    while (y < gameHeight) {
        ctx.fillRect(x, y + step * 0.25, w, step / 2);
        y += step;
    }

    ctx.save();

    // draw paddles and the ball
    playerA.draw();
    playerB.draw();
    ball.draw();

    // write score
    ctx.font = "bold 3em Arial";
    ctx.textAlign="end";
    ctx.fillText(score[0], gameWidth / 2 - 100, gameHeight / 10);
    ctx.textAlign="start";
    ctx.fillText(score[1], gameWidth / 2 + 100, gameHeight / 10);

    if (paused) {
        // write pause menu
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10em Arial";
        ctx.fillText("PAUSED", gameWidth / 2 - 323, gameHeight / 2);
        ctx.font = "1em Arial";
        ctx.fillText("Press Esc to unpause the game", gameWidth / 2 - 108, gameHeight / 2 + 30);

        // write controls
        ctx.font = "1.5em Arial";
        ctx.fillText("Controls:", 20, (gameHeight / 50)*46)
        ctx.font = "1em Arial";
        ctx.fillText("Player A: Q / A", 20, (gameHeight / 50)*47);
        ctx.fillText("Player B: Arrow Up / Arrow Down", 20, (gameHeight / 50)*48);
        ctx.fillText("Menu: Esc", 20, (gameHeight / 50)*49);
    }

    ctx.restore();
}

// start the game!
main();