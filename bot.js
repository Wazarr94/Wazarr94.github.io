function chaseBallBot(player, args = {}) {
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

function chaseBallBotPrime(player, args = {}) {
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

function playInputs(player, args = {}) {
    if (player.disc != null) {
        player.inputs = args.inputArray[currentFrame];
        return;
    }
}

function distDiscs(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function controllerPoint(player, targetPoint, targetVel, precision) {
    if (player.disc != null) {
        var threshold = precision;
        var input = 0;
        if (player.disc.x - targetPoint.x > threshold) input += Input.LEFT;
        if (player.disc.x - targetPoint.x < -threshold) input += Input.RIGHT;
        if (player.disc.y - targetPoint.y > threshold) input += Input.UP;
        if (player.disc.y - targetPoint.y < -threshold) input += Input.DOWN;
        player.inputs = input;
        return;
    }
}

var eps = 0.0000001;

function between(a, b, c) {
    return a - eps <= b && b <= c + eps;
}

function segment_intersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
        ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
        ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
    if (isNaN(x) || isNaN(y)) {
        return false;
    } else {
        if (x1 >= x2) {
            if (!between(x2, x, x1)) { return false; }
        } else {
            if (!between(x1, x, x2)) { return false; }
        }
        if (y1 >= y2) {
            if (!between(y2, y, y1)) { return false; }
        } else {
            if (!between(y1, y, y2)) { return false; }
        }
        if (x3 >= x4) {
            if (!between(x4, x, x3)) { return false; }
        } else {
            if (!between(x3, x, x4)) { return false; }
        }
        if (y3 >= y4) {
            if (!between(y4, y, y3)) { return false; }
        } else {
            if (!between(y3, y, y4)) { return false; }
        }
    }
    return { x: x, y: y };
}

function goalkeeperBot(player, args = {}) {
    var ball = discs[0];
    var input = 0;

    if (player.team.id == haxball.Team.BLUE.id) { //TODO : Miror

    }

    if (game.state == 0) {
        if (player.avatar != "1") {
            this.avatar = "1";
            this.avatarContext = createAvatarCanvas();
            this.avatarPattern = getAvatarPattern(this.avatarContext, this.avatar, this.team === haxball.Team.BLUE ? [getDecimalFromRGB(haxball.Team.BLUE.color)] : [getDecimalFromRGB(haxball.Team.RED.color)]);
        }
        if (game.kickoffReset == 8) {
            if (distDiscs(player.disc, ball) > 8 * player.disc.radius) {
                chaseBallBot(player, args);
                return;
            }
            else {
                chaseBallBot(player, args);
                return;
            }
        }
    }
    else if (game.state == 1) {
        controllerPoint(player, positionKeeper(player, stadium.goals[0], ball), null, 1);
        if (Math.sqrt((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2) - ball.radius - player.disc.radius < 4) input += Input.SHOOT;
        player.inputs += input;
    }
    else if (game.state == 2) {
        player.inputs = 0;
        if (currentFrame % 30 < 30 / 2) player.avatar = "😡";
        else player.avatar = "🤬";
        this.avatarContext = createAvatarCanvas();
        this.avatarPattern = getAvatarPattern(player.avatarContext, player.avatar, player.team === haxball.Team.BLUE ? [getDecimalFromRGB(haxball.Team.BLUE.color)] : [getDecimalFromRGB(haxball.Team.RED.color)]);
        if (currentFrame % 10 < 2) input += Input.SHOOT;
        player.inputs += input;
    }
}

function positionKeeper(player, goal, ball) {
    var centerGoal = { "x": (goal.p0[0] + goal.p1[0]) / 2, "y": (goal.p0[1] + goal.p1[1]) / 2 };
    var intersection = segment_intersection(centerGoal.x, centerGoal.y, ball.x, ball.y, -315, goal.p0[1], -315, goal.p1[1]);
    if (!intersection) {
        intersection = segment_intersection(centerGoal.x, centerGoal.y, ball.x, ball.y, goal.p0[0], goal.p0[1], -315, goal.p0[1]);
        if (!intersection) {
            intersection = segment_intersection(centerGoal.x, centerGoal.y, ball.x, ball.y, goal.p1[0], goal.p1[1], -315, goal.p1[1]);
            if (!intersection) {
                intersection = segment_intersection(centerGoal.x, ball.y, ball.x, ball.y, goal.p0[0], goal.p0[1], goal.p1[0], goal.p1[1]);
            }
            else {
                if (intersection.x < goal.p1[0] + 1.7 * player.disc.radius) {
                    intersection.x = goal.p1[0] + 1.7 * player.disc.radius;
                }
            }
        }
        else {
            if (intersection.x < goal.p0[0] + 1.7 * player.disc.radius) {
                intersection.x = goal.p0[0] + 1.7 * player.disc.radius;
            }
        }
    }
    return intersection;
}

function alwaysRight(player, args = {}) {
    player.inputs = input.RIGHT;
    return
}
