import { CONFIG } from "./config.js";
import { Ball } from "./ball.js";
import { Keeper } from "./keeper.js";
import { TEAMS } from "./teams.js";

export class Game {

    constructor() {

        this.canvas = document.getElementById("game");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.width = CONFIG.WIDTH;
        this.canvas.height = CONFIG.HEIGHT;

// Load all flag images
this.flagImages = {};

for (const team of TEAMS) {

    const img = new Image();
    img.src = `assets/flags/${team.flag}`;

    this.flagImages[team.name] = img;

}

        this.balls = [
            new Ball(400, 300, 250, -120, "#1E90FF"),
            new Ball(600, 300, -250, 120, "#FF4040")
        ];

this.leftKeeper = new Keeper(35, "#3399ff");
this.rightKeeper = new Keeper(CONFIG.WIDTH - 45, "#ff4444");

this.homeTeam = "Japan";
this.awayTeam = "Brazil";

const home = this.getTeam(this.homeTeam);
const away = this.getTeam(this.awayTeam);

this.leftKeeper.color = home.color;
this.rightKeeper.color = away.color;

this.resetKickoff();

this.homeScore = 0;
this.awayScore = 0;

this.matchTime = 0;
this.antiStallTimer = 0;
this.matchLength = 30;

this.matchPhase = "normal";

        this.lastTime = performance.now();

this.homeSelect = document.getElementById("homeTeam");
this.awaySelect = document.getElementById("awayTeam");

this.modeSelect = document.getElementById("matchMode");

for (const team of TEAMS) {

    this.homeSelect.add(
        new Option(team.name, team.name)
    );

    this.awaySelect.add(
        new Option(team.name, team.name)
    );

}

this.homeSelect.value = "Japan";
this.awaySelect.value = "Brazil";

document
    .getElementById("startMatch")
    .addEventListener("click", () => {

        this.homeTeam = this.homeSelect.value;
        this.awayTeam = this.awaySelect.value;

this.allowDraws = this.modeSelect.value === "draw";

console.log("Mode:", this.modeSelect.value, this.allowDraws);

const home = this.getTeam(this.homeTeam);
const away = this.getTeam(this.awayTeam);

this.leftKeeper.color = home.color;
this.rightKeeper.color = away.color;

        this.homeScore = 0;
        this.awayScore = 0;

        this.matchTime = 0;

this.matchPhase = "normal";

this.antiStallTimer = 0;

        this.resetKickoff();

    });

        requestAnimationFrame(this.loop.bind(this));
    }

    loop(now) {

        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

   update(dt) {

if (this.matchPhase === "finished") {
    return;
}

// Advance the match timer unless the match has finished
if (this.matchPhase !== "finished") {

    this.matchTime += dt;
    this.antiStallTimer += dt;

}

// End of normal time (90')
if (
    this.matchPhase === "normal" &&
    this.matchTime >= this.matchLength
) {

    if (this.homeScore !== this.awayScore || this.allowDraws) {

        this.matchPhase = "finished";
        return;

    }

    // Knockout match tied → Extra Time
    this.matchPhase = "extra";

}

// End of extra time (120')
if (
    this.matchPhase === "extra" &&
    this.matchTime >= this.matchLength + 10
) {

    if (this.homeScore !== this.awayScore) {

        this.matchPhase = "finished";
        return;

    }

    // Still tied → Golden Goal
    this.matchPhase = "golden";

}

    for (const ball of this.balls) {
        ball.update(dt);
    }

    const leftTarget =
        this.balls[0].x < this.balls[1].x ? this.balls[0] : this.balls[1];

    const rightTarget =
        this.balls[0].x > this.balls[1].x ? this.balls[0] : this.balls[1];

    this.leftKeeper.update(leftTarget.y, dt);
    this.rightKeeper.update(rightTarget.y, dt);

    this.handleBallCollisions();
    this.handleKeeperCollisions();
    this.checkGoals();

if (this.antiStallTimer >= 2) {

    this.antiStallTimer = 0;

    this.checkForStall();

}

}

handleBallCollisions() {

    if (this.balls.length < 2) return;

    const a = this.balls[0];
    const b = this.balls[1];

    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = a.radius + b.radius;

    if (distance >= minDistance || distance === 0) {
        return;
    }

    // Unit normal
    const nx = dx / distance;
    const ny = dy / distance;

    // Push balls apart
    const overlap = minDistance - distance;
    a.x -= nx * overlap / 2;
    a.y -= ny * overlap / 2;

    b.x += nx * overlap / 2;
    b.y += ny * overlap / 2;

    // Relative velocity
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;

    const speed = dvx * nx + dvy * ny;

    // If moving apart, don't bounce again
    if (speed <= 0) return;

    // Equal-mass elastic collision
    const impulse = speed;

    a.vx -= impulse * nx;
    a.vy -= impulse * ny;

    b.vx += impulse * nx;
    b.vy += impulse * ny;

}

handleKeeperCollisions() {

    this.checkKeeper(this.leftKeeper);

    this.checkKeeper(this.rightKeeper);

}

checkKeeper(keeper) {

    for (const ball of this.balls) {

        const closestX = Math.max(
            keeper.x,
            Math.min(ball.x, keeper.x + keeper.width)
        );

        const closestY = Math.max(
            keeper.y - keeper.height / 2,
            Math.min(ball.y, keeper.y + keeper.height / 2)
        );

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;

        const dist2 = dx * dx + dy * dy;

        if (dist2 < ball.radius * ball.radius) {

            // Push ball outside keeper
            if (ball.x < keeper.x + keeper.width / 2) {

                ball.x = keeper.x - ball.radius;

            } else {

                ball.x = keeper.x + keeper.width + ball.radius;

            }

            // Bounce
            ball.vx *= -1;

        }

    }

}

checkGoals() {

    const goalTop = (CONFIG.HEIGHT - CONFIG.GOAL_SIZE) / 2;
    const goalBottom = goalTop + CONFIG.GOAL_SIZE;

    for (const ball of this.balls) {

        if (ball.y < goalTop || ball.y > goalBottom) continue;

        // Ball entered LEFT goal
if (ball.x < -ball.radius) {

    if (ball === this.balls[0]) {
        // Japan own goal
        this.awayScore++;
    } else {
        // Brazil scored
        this.awayScore++;
    }

 if (this.matchPhase === "golden") {

    this.resetKickoff();
    this.matchPhase = "finished";
    return;

}

this.resetKickoff();
return;
}

        // Ball entered RIGHT goal
if (ball.x > CONFIG.WIDTH + ball.radius) {

    if (ball === this.balls[0]) {
        // Japan scored
        this.homeScore++;
    } else {
        // Brazil own goal
        this.homeScore++;
    }

    if (this.matchPhase === "golden") {

    this.resetKickoff();
    this.matchPhase = "finished";
    return;

}

this.resetKickoff();
return;
}

    }

}

resetKickoff() {

   this.balls[0].x = 400;
this.balls[0].y = 300;

this.balls[1].x = 600;
this.balls[1].y = 300;

const speed1 = CONFIG.BALL_SPEED + Math.random() * 40;
const speed2 = CONFIG.BALL_SPEED + Math.random() * 40;

const angle1 = (Math.random() - 0.5) * 0.8;
const angle2 = (Math.random() - 0.5) * 0.8;

this.balls[0].vx = Math.cos(angle1) * speed1;
this.balls[0].vy = Math.sin(angle1) * speed1;

this.balls[1].vx = -Math.cos(angle2) * speed2;
this.balls[1].vy = Math.sin(angle2) * speed2;

const home = this.getTeam(this.homeTeam);
const away = this.getTeam(this.awayTeam);

this.balls[0].flagImage = this.flagImages[home.name];
this.balls[1].flagImage = this.flagImages[away.name];

this.balls[0].color = home.color;
this.balls[1].color = away.color;

}

    render() {

        const ctx = this.ctx;

        // Grass
        ctx.fillStyle = "#188038";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Lines
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;

        ctx.strokeRect(6, 6, this.canvas.width - 12, this.canvas.height - 12);

        // Halfway line
        ctx.beginPath();
        ctx.moveTo(this.canvas.width / 2, 6);
        ctx.lineTo(this.canvas.width / 2, this.canvas.height - 6);
        ctx.stroke();

        // Centre circle
        ctx.beginPath();
        ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 75, 0, Math.PI * 2);
        ctx.stroke();

        // Centre spot
        ctx.beginPath();
        ctx.arc(this.canvas.width / 2, this.canvas.height / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();

        // Penalty boxes
        ctx.strokeRect(6, 170, 120, 260);
        ctx.strokeRect(this.canvas.width - 126, 170, 120, 260);

        // Six-yard boxes
        ctx.strokeRect(6, 230, 45, 140);
        ctx.strokeRect(this.canvas.width - 51, 230, 45, 140);

        // Balls
        for (const ball of this.balls) {
            ball.draw(ctx);
        }
        const goalTop = (CONFIG.HEIGHT - CONFIG.GOAL_SIZE) / 2;

// Highlight the goal openings
ctx.fillStyle = "#FFD700";

ctx.fillRect(0, goalTop, 6, CONFIG.GOAL_SIZE);

ctx.fillRect(
    CONFIG.WIDTH - 6,
    goalTop,
    6,
    CONFIG.GOAL_SIZE
);

this.leftKeeper.draw(ctx);
this.rightKeeper.draw(ctx);

ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
ctx.fillRect(150, 5, 700, 75);

// ===== Scoreboard =====

ctx.fillStyle = "white";

ctx.font = "28px Arial";
ctx.textAlign = "center";

const home = this.getTeam(this.homeTeam);
const away = this.getTeam(this.awayTeam);

const homeFlag = this.flagImages[home.name];
const awayFlag = this.flagImages[away.name];

// Home flag
ctx.drawImage(
    homeFlag,
    172,
    14,
    80,
    60
);

// Away flag
ctx.drawImage(
    awayFlag,
    748,
    14,
    80,
    60
);

ctx.fillStyle = "white";
ctx.font = "28px Arial";
ctx.textAlign = "center";

ctx.fillText(
    `${this.homeTeam} ${this.homeScore}–${this.awayScore} ${this.awayTeam}`,
    this.canvas.width / 2,
    35
);

const minute = Math.floor(
    (this.matchTime / this.matchLength) * 90
);

ctx.font = "20px Arial";

ctx.fillText(
    `${minute}'`,
    this.canvas.width / 2,
    65
);

    }

checkForStall() {

    for (const ball of this.balls) {

        const speed = Math.hypot(ball.vx, ball.vy);

        // Too slow? Restore speed.
        if (speed < 250) {

            const angle = Math.atan2(ball.vy, ball.vx);
            const newSpeed = 340;

            ball.vx = Math.cos(angle) * newSpeed;
            ball.vy = Math.sin(angle) * newSpeed;

        }

        // Mostly moving vertically? Give it a sideways push.
        if (Math.abs(ball.vx) < Math.abs(ball.vy) * 0.25) {

            ball.vx += (Math.random() - 0.5) * 250;

        }

    }

}

getTeam(name) {

    return TEAMS.find(team => team.name === name);

}

}