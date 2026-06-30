import { CONFIG } from "./config.js";

export class Ball {
    constructor(x, y, vx, vy, color, flagImage = null) {
        this.x = x;
        this.y = y;

        this.vx = vx;
        this.vy = vy;

        this.radius = CONFIG.BALL_RADIUS;
        this.color = color;
        this.flagImage = flagImage;
    }

    update(dt) {

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Left wall
    // Left wall
if (this.x - this.radius <= 0) {

    const goalTop = (CONFIG.HEIGHT - CONFIG.GOAL_SIZE) / 2;
    const goalBottom = goalTop + CONFIG.GOAL_SIZE;

    const inGoal = this.y > goalTop && this.y < goalBottom;

    if (!inGoal) {
        this.x = this.radius;
        this.vx *= -1;
    }

}

// Right wall
if (this.x + this.radius >= CONFIG.WIDTH) {

    const goalTop = (CONFIG.HEIGHT - CONFIG.GOAL_SIZE) / 2;
    const goalBottom = goalTop + CONFIG.GOAL_SIZE;

    const inGoal = this.y > goalTop && this.y < goalBottom;

    if (!inGoal) {
        this.x = CONFIG.WIDTH - this.radius;
        this.vx *= -1;
    }

}

    // Top wall
    if (this.y - this.radius <= 0) {
        this.y = this.radius;
        this.vy *= -1;
    }

    // Bottom wall
    if (this.y + this.radius >= CONFIG.HEIGHT) {
        this.y = CONFIG.HEIGHT - this.radius;
        this.vy *= -1;
    }

}

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Draw either the team's flag or a coloured circle
if (this.flagImage && this.flagImage.complete) {

    ctx.save();

    // Clip to the marble
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
        this.flagImage,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2,
        this.radius * 2
    );

    ctx.restore();

} else {

    ctx.fillStyle = this.color;
    ctx.fill();

}

// White outline
ctx.beginPath();
ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

ctx.lineWidth = 2;
ctx.strokeStyle = "white";
ctx.stroke();

    }
}