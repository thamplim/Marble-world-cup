import { CONFIG } from "./config.js";
export class Keeper {

    constructor(x, color) {

        this.x = x;
        this.y = 300;

        this.width = 12;
        this.height = 50;

        this.speed = 150;

this.reactionTimer = 0;
this.reactionTime = 0.12;
this.targetY = this.y;

        this.color = color;

    }

 update(targetY, dt) {

    // Countdown until the keeper is allowed to react again
    this.reactionTimer -= dt;

    // Only update the target every 0.12 seconds
    if (this.reactionTimer <= 0) {

        this.targetY = targetY;
        this.reactionTimer = this.reactionTime;

    }

    // Move towards the stored target
    if (this.targetY > this.y)
        this.y += this.speed * dt;

    if (this.targetY < this.y)
        this.y -= this.speed * dt;

    // Keep the keeper inside the pitch
    if (this.y < this.height / 2)
        this.y = this.height / 2;

    if (this.y > CONFIG.HEIGHT - this.height / 2)
        this.y = CONFIG.HEIGHT - this.height / 2;

}

draw(ctx) {

    ctx.fillStyle = this.color;

    ctx.fillRect(
        this.x,
        this.y - this.height / 2,
        this.width,
        this.height
    );

}

}