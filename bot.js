function resolveBotInputs1 (player, args = {}) {
    if (player.disc != null) {
        var ball = discs[0];
        var threshold = 2;
        var input = 0;
        if (player.disc.x - ball.x > threshold) input += Input.LEFT;
        if (player.disc.x - ball.x < -threshold) input += Input.RIGHT;
        if (player.disc.y - ball.y > threshold) input += Input.UP;
        if (player.disc.y - ball.y < -threshold) input += Input.DOWN;
        if ((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2 <= (ball.radius + player.disc.radius + 0.1) ** 2) input += Input.SHOOT;
        player.inputs = input;
        return;
    }
}

function resolveBotInputs2 (player, args = {}) {
    if (player.disc != null) {
        var ball = discs[0];
        var threshold = 2;
        var input = 0;
        if (currentFrame % 10 == 0) input += Input.UP;
        if (player.disc.x - ball.x > threshold) input += Input.LEFT;
        if (player.disc.x - ball.x < -threshold) input += Input.RIGHT;
        if (player.disc.y - ball.y > threshold) input += Input.UP;
        if (player.disc.y - ball.y < -threshold) input += Input.DOWN;
        if ((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2 <= (ball.radius + player.disc.radius + 0.05) ** 2) input += Input.SHOOT;
        player.inputs = input;
        return;
    }
}

function playInputs (player, args = {}) {
    if (player.disc != null) {
        player.inputs = args.inputArray[currentFrame];
        return;
    }
}
