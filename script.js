// TODO : Finish frame animation (include time)
// TODO : Sound
// TODO : Goal announcements
// TODO : Fix nickname issue
// TODO : Clean-up
// TODO : Chat (for commands)
// TODO : AI Players
// TODO : Menu
// TODO : Recording system

// BUG : when goal, weird physics happening ?

var canvas = document.getElementById("canvas_div");
var ctx = canvas.getContext("2d", { alpha: true });

var margin = 0;

//==== Program State

// cache of patterns
var bg_patterns = {};

// cached canvas size info

var canvas_rect = [-150, -75, 150, 75];

//===== Haxball Values

function Player () { };
function Disc () { };
function Game () { };

Disc.prototype = {
    ballPhysics: function () {
        this.radius = 10;
        this.bCoef = 0.5;
        this.invMass = 1;
        this.damping = 0.99;
        this.color = "FFFFFF";
        this.x = 0;
        this.y = 0;
        this.xspeed = 0;
        this.yspeed = 0;
        this.cGroup = 193;
        this.cMask = 63;
    },
    playerPhysics: function () {
        this.radius = 15;
        this.bCoef = 0.5;
        this.invMass = 0.5;
        this.damping = 0.96;
        this.acceleration = 0.1;
        this.kickingAcceleration = 0.07;
        this.kickingDamping = 0.96;
        this.kickStrength = 5;
        this.color = "FFFFFF";
        this.x = 0;
        this.y = 0;
        this.xspeed = 0;
        this.yspeed = 0;
        this.cGroup = 0;
        this.cMask = 39;
    }
}

Game.prototype = {
    init: function () {
        this.state = 0;
        this.start = true;
        this.timeout = 0;
        this.timeLimit = 3;
        this.scoreLimit = 3;
        this.red = 0;
        this.blue = 0;
        this.time = 0;
        this.teamGoal = haxball.Team.SPECTATORS;
    }
}

Player.prototype = {
    default: function () {
        this.disc = null;
        this.name = "Player";
        this.team = haxball.Team.SPECTATORS;
        this.avatar = '';
        var a = window.document.createElement("canvas");
        var b = window.document.createElement("canvas");
        this.avatarContext = a.getContext("2d", null);
        this.avatarPattern = getAvatarPattern(this.avatarContext, this.avatar, [getRGBA(haxball.Team.BLUE.color)]);
        this.nicknameCanvasContext = drawTextNickCanvas(b.getContext("2d", null), name);
        this.inputs = 0;
        this.shooting = false;
        this.shotReset = false;
        this.spawnPoint = 0;
        this.controls = [["ArrowUp"], ["ArrowLeft"], ["ArrowDown"], ["ArrowRight"], ["KeyX"]];
    },
    init: function (name, avatar, team, controls) {
        this.default();
        if (name !== undefined) {
            this.name = name;
            var b = window.document.createElement("canvas");
            this.nicknameCanvasContext = drawTextNickCanvas(b.getContext("2d", null), name);
        }
        if (team !== undefined) {
            this.team = team;
        }
        if (avatar !== undefined) {
            this.avatar = avatar;
            this.avatarContext = createAvatarCanvas();
            this.avatarPattern = getAvatarPattern(this.avatarContext, this.avatar, this.team === haxball.Team.BLUE ? [getDecimalFromRGB(haxball.Team.BLUE.color)] : [getDecimalFromRGB(haxball.Team.RED.color)]);
        }
        if (controls !== undefined) this.controls = controls;
    }
}
// values hardcoded in haxball
var haxball = {
    hockey: {
        bg_color: 'rgb(85, 85, 85)',
        border_color: 'rgb(233,204,110)'
    },
    grass: {
        bg_color: 'rgb(113,140,90)',
        border_color: 'rgb(199,230,189)'
    },
    segment_color: 'rgb(0,0,0)',
    Team: {
        RED: {
            name: "t-red",
            id: 1,
            color: 'rgb(229, 110, 86)',
            cGroup: 2
        },
        BLUE: {
            name: "t-blue",
            id: 2,
            color: 'rgb(86,137,229)',
            cGroup: 4
        },
        SPECTATORS: {
            name: "t-spectators",
            id: 0,
            color: null,
            cGroup: 0
        },
    },
    playerPhysics: {
        radius: 15,
        bCoef: 0.5,
        invMass: 0.5,
        damping: 0.96,
        acceleration: 0.1,
        kickingAcceleration: 0.07,
        kickingDamping: 0.96,
        kickStrength: 5,
        pos: [0, 0],
        cMask: ["all"],
        cGroup: [""]
    },
    ballPhysics: {
        radius: 10,
        bCoef: 0.5,
        invMass: 1,
        damping: 0.99,
        color: "FFFFFF",
        pos: [0, 0],
        cMask: ["all"],
        cGroup: ["ball"]
    },
    discPhysics: {
        radius: 10,
        bCoef: 0.5,
        invMass: 0,
        damping: 0.99,
        color: 'rgb(255,255,255)',
        cMask: ["all"],
        cGroup: ["all"]
    },
    segmentPhysics: {
        curve: 0,
        bCoef: 1,
        cGroup: ["wall"],
        cMask: ["all"]
    },
    planePhysics: {
        bCoef: 1,
        cGroup: ["wall"],
        cMask: ["all"]
    },
    vertexPhysics: {
        bCoef: 1,
        cGroup: ["wall"],
        cMask: ["all"]
    },
    collisionFlags: {
        all: 63,
        ball: 1,
        blue: 4,
        blueKO: 16,
        c0: 268435456,
        c1: 536870912,
        c2: 1073741824,
        c3: -2147483648,
        kick: 64,
        red: 2,
        redKO: 8,
        score: 128,
        wall: 32
    }
};

var zoom_levels = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5];
var zoom = zoom_levels[3];


var stadium = JSON.parse(`{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
var stadiumP = JSON.parse(`{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1},{"bCoef":1,"dist":0,"normal":[-0.5,0.5]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
var stadium2 = JSON.parse(`{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);

var stadium_copy = JSON.parse(JSON.stringify(stadium));
var cameraFollowMode = 0;
var cameraFollow = { "x": 0, "y": 0 };

var discs = stadium_copy.discs;
discs.forEach((d) => {
    if (d.trait !== undefined) {
        for (const [key, value] of Object.entries(stadium.traits[d.trait])) {
            if (d[key] === undefined) d[key] = value;
        }
    }
    for (const [key, value] of Object.entries(haxball.discPhysics)) {
        if (d[key] === undefined) d[key] = value;
    }
    d = collisionTransformation(d);
});

var ballPhysics = stadium_copy.ballPhysics || {};
for (const [key, value] of Object.entries(haxball.ballPhysics)) {
    if (ballPhysics[key] === undefined) ballPhysics[key] = value;
}
discs.unshift(collisionTransformation(ballPhysics));

var vertexes = stadium_copy.vertexes;
vertexes.forEach((v) => {
    if (v.trait !== undefined) {
        for (const [key, value] of Object.entries(stadium.traits[v.trait])) {
            if (v[key] === undefined) v[key] = value;
        }
    }
    for (const [key, value] of Object.entries(haxball.vertexPhysics)) {
        if (v[key] === undefined) v[key] = value;
    }
    v = collisionTransformation(v);
});

var segments = stadium_copy.segments;
segments.forEach((s) => {
    if (s.trait !== undefined) {
        for (const [key, value] of Object.entries(stadium.traits[s.trait])) {
            if (s[key] === undefined) s[key] = value;
        }
    }
    for (const [key, value] of Object.entries(haxball.segmentPhysics)) {
        if (s[key] === undefined) s[key] = value;
    }
    s = collisionTransformation(s, vertexes);
    getCurveFSegment(s);
    getStuffSegment(s);
});

var planes = stadium_copy.planes;
planes.forEach((p) => {
    for (const [key, value] of Object.entries(haxball.planePhysics)) {
        if (p[key] === undefined) p[key] = value;
    }
    if (p.trait !== undefined) {
        for (const [key, value] of Object.entries(stadium.traits[p.trait])) {
            p[key] = value;
        }
    }
    p = collisionTransformation(p);
});

var goals = stadium_copy.goals;
goals.forEach((g) => {
    g.team = g.team === "red" ? haxball.Team.RED : haxball.Team.BLUE;
});

stadium = JSON.parse(JSON.stringify(stadium_copy));

var game = new Game;
game.init();

load_tile('grass');
load_tile('hockey');

var scorableDiscsId = function () {
    for (var a = [], b = 0; b < 256; b++) a.push(0);
    return a;
}();

var scorableDiscsPos = function () {
    for (var a = [], b = 0; b < 256; b++) a.push([0, 0]);
    return a;
}();

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var a = new Player;
a.init("Gouiri", "10", haxball.Team.RED);
setPlayerDefaultProperties(a);
var playersArray = [a];

resetPositionDiscs();

function createNickCanvas() { // canvas for nickname
    var a = window.document.createElement("canvas");
    a.width = 160;
    a.height = 34;
    nicknameCanvasCtx = a.getContext("2d", null);
}

function createAvatarCanvas() { // canvas for avatar
    var a = window.document.createElement("canvas");
    a.width = 64;
    a.height = 64;
    return avatarCanvasCtx = a.getContext("2d", null);
}

function checkKick(player) {
    if (player.shotReset) return !player.shooting;
    return player.shooting;
}

function getRGBA(a) {
    return "rgba(" + [(a & 16711680) >>> 16, (a & 65280) >>> 8, a & 255].join() + ",255)"
}

function getInputs(a, b, c, d, e) {
    return a + b * 2 + c * 4 + d * 8 + e * 16;
}

function getDecimalFromRGB(a) {
    var b = a.substring(4, a.length - 1).split(",");
    return (parseInt(b[0]) << 16) + (parseInt(b[1]) << 8) + parseInt(b[2]);
}

function getAvatarPattern(ctx, avatar, colors) {
    if (colors.length > 0) {
        ctx.save();
        ctx.translate(32, 32);
        ctx.rotate(3.141592653589793 * 32 / 128);
        for (var c = -32, d = 64 / colors.length, e = 0; e < colors.length; e++) {
            ctx.fillStyle = getRGBA(colors[e]);
            ctx.fillRect(c, -32, d + 4, 64);
            c += d;
        }
        ctx.restore();
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = "900 34px 'Arial Black','Arial Bold',Gadget,sans-serif";
        ctx.fillText(avatar.substring(0, 2), 32, 44);
        var avatarPattern = ctx.createPattern(ctx.canvas, "no-repeat");
        return avatarPattern;
    }
}

function drawPlayerDisc(player) { // draws (player) discs
    ctx.beginPath();
    ctx.fillStyle = player.avatarPattern;
    ctx.strokeStyle = checkKick(player) ? "white" : "black";
    ctx.beginPath();
    ctx.arc(player.disc.x, player.disc.y, player.disc.radius, 0, 2 * Math.PI, false);
    ctx.save();
    var c = player.disc.radius / 32;
    ctx.translate(player.disc.x, player.disc.y);
    ctx.scale(c, c);
    ctx.translate(-32, -32);
    ctx.fill();
    ctx.restore();
    ctx.stroke();
}

function drawPlayerDiscExtLine(player) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "white";
    ctx.globalAlpha = 0.3;
    ctx.arc(player.x, player.y, player.radius + 10, 0, 2 * Math.PI, false);
    ctx.stroke();
    ctx.globalAlpha = 1;
}

function drawTextNickCanvas(ctx, nickname) { // draw text in nickname canvas
    ctx.resetTransform();
    ctx.clearRect(0, 0, 160, 34);
    ctx.font = "26px sans-serif";
    ctx.fillStyle = "white";
    if (ctx.measureText(nickname).width > 160) {
        ctx.textAlign = "left";
        ctx.translate(2, 29);
    }
    else {
        ctx.textAlign = "center";
        ctx.translate(80, 29);
    }
    ctx.fillText(nickname, 0, 0);
    return ctx;
}

function insertNickCanvasGlobalCanvas(globalCtx, nickCtx, x, y) { // draw nickname canvas in global canvas
    globalCtx.drawImage(nickCtx.canvas, 0, 0, 160, 34, x - 40, y - 34, 80, 17)
}

function setDiscDefaultProperties (currentDisc, defaultDisc) {
    currentDisc.x = defaultDisc.x;
    currentDisc.y = defaultDisc.y;
    currentDisc.xspeed = defaultDisc.xspeed;
    currentDisc.yspeed = defaultDisc.yspeed;
    currentDisc.radius = defaultDisc.radius;
    currentDisc.bCoef = defaultDisc.bCoef;
    currentDisc.invMass = defaultDisc.invMass;
    currentDisc.damping = defaultDisc.damping;
    currentDisc.cGroup = defaultDisc.cGroup;
    currentDisc.cMask = defaultDisc.cMask;
}

function setPlayerDefaultProperties(player) {
    if (player.team == haxball.Team.SPECTATORS) player.disc = null;
    else {
        player.inputs = 0;
        var b = player.disc;
        if (b == null) {
            b = new Disc;
            b.playerPhysics();
            player.disc = b;
            discs.push(b);
        }
        var c = collisionTransformation(haxball.playerPhysics);
        b.radius = c.radius;
        b.invMass = c.invMass;
        b.damping = c.damping;
        b.bCoef = c.bCoef;
        b.cMask = 39 + (player.team == haxball.Team.RED ? haxball.collisionFlags.redKO : haxball.collisionFlags.blueKO);
        b.cGroup = player.team.cGroup | c.cGroup;
        b.x = (2 * player.team.id - 3) * stadium.width;
        b.y = 0;
        b.xspeed = 0;
        b.yspeed = 0;
    }
}

function setCameraFollow(game, playerPos, widthCal, heightCal, refresh) {
    var f, g;
    if (playerPos != null && cameraFollowMode == 1) { // no camera follow
        f = playerPos.x;
        g = playerPos.y;
    }
    else {
        f = discs[0].x;
        g = discs[0].y;
        if (playerPos != null) {
            f = .5 * (f + playerPos.x); // center of ball-player x
            g = .5 * (g + playerPos.y); // center of ball-player y
            var midX = .5 * widthCal, // middle of screen x
                midY = .5 * heightCal; // middle of screen y
            var t = playerPos.x - midX + 50, // lim sup x
                n = playerPos.y - midY + 50, // lim sup y
                k = playerPos.x + midX - 50, // lim inf x
                h = playerPos.y + midY - 50; // lim inf y
            f = f > k ? k : f < t ? t : f;
            g = g > h ? h : g < n ? n : g
        }
    }
    n = 60 * refresh;
    if (n > 1) n = 1;
    n *= .04;
    cameraFollow.x += (f - cameraFollow.x) * n;
    cameraFollow.y += (g - cameraFollow.y) * n;
    checkCameraLimits(widthCal, heightCal, stadium) // stay within stadium limits
}

function checkCameraLimits(widthCal, heightCal, stadium) {
    if (widthCal > 2 * stadium.width) cameraFollow.x = 0;
    else if (cameraFollow.x + .5 * widthCal > stadium.width) cameraFollow.x = stadium.width - .5 * widthCal;
    else if (cameraFollow.x - .5 * widthCal < -stadium.width) cameraFollow.x = -stadium.width + .5 * widthCal;

    if (heightCal > 2 * stadium.height) cameraFollow.y = 0;
    else if (cameraFollow.y + .5 * heightCal > stadium.height) cameraFollow.y = stadium.height - .5 * heightCal;
    else if (cameraFollow.y - .5 * heightCal < -stadium.height) cameraFollow.y = -stadium.height + .5 * heightCal;
}

function resetPositionDiscs() {
    var a = playersArray;
    game.state = 0;
    for (var b = stadium.discs, c = discs, d = 0, e = 1; d < e; d++) { // TODO : full kickoffReset
        setDiscDefaultProperties(c[d], b[d]);
    }
    b = [0, 0, 0];
    for (c = 0; c < a.length; c++) {
        d = a[c];
        setPlayerDefaultProperties(d);
        e = d.team;
        if (e !== haxball.Team.SPECTATORS) {
            var f = d.disc,
                g = stadium,
                l = b[e.id];
            // TODO : teamSpawnPoints
            k = l + 1 >> 1;
            if ((l % 1) == 1) k = -k;
            g = stadium.spawnDistance * (2 * e.id - 3); // +- spawnDistance
            l = 55 * k;
            f.x = g;
            f.y = l;
            b[e.id]++;
        }
    }
}

function keyDownHandler (e) {
    playersArray.forEach((p) => {
        p.controls.forEach((c, i) => {
            if (c.find(x => x == e.code)) {
                if ((p.inputs & (2 ** i)) == 0) p.inputs += 2 ** i;
            }
        });
    });
    if (e.code.substring(0, e.code.length - 1) == "Digit") {
        var nb = parseInt(e.code[e.code.length - 1]);
        if (nb > 0 && nb <= zoom_levels.length) {
            zoom = zoom_levels[nb - 1];
        }
    }
}

function keyUpHandler (e) {
    playersArray.forEach((p) => {
        p.controls.forEach((c, i) => {
            if (c.find(x => x == e.code)) {
                if ((p.inputs & (2 ** i)) != 0) p.inputs -= 2 ** i;
            }
        });
    });
}

function collisionTransformation (physics, vertexes = null) {
    var cMask = physics.cMask;
    var y = 0;
    if (typeof cMask === "object") {
        cMask.forEach((x) => {
            y |= haxball.collisionFlags[x];
        });
    }
    physics.cMask = y;
    var cGroup = physics.cGroup;
    y = 0;
    if (typeof cGroup === "object") {
        cGroup.forEach((x) => {
            y |= haxball.collisionFlags[x];
        });
    }
    physics.cGroup = y;
    if (y == 1) physics.cGroup = 193;
    if (physics.pos !== undefined) {
        physics.x = physics.pos[0];
        physics.y = physics.pos[1];
        physics.xspeed = 0;
        physics.yspeed = 0;
    }
    if (physics.v0 !== undefined && vertexes !== null) {
        physics.v0 = [vertexes[physics.v0].x, vertexes[physics.v0].y];
        physics.v1 = [vertexes[physics.v1].x, vertexes[physics.v1].y];
    }
    delete physics.pos;
    delete physics.trait;
    return physics;
}

function getCurveFSegment(segment) {
    var a = segment.curve;
    a *= .017453292519943295;
    if (a < 0) {
        a *= -1;
        segment.curve *= -1;
        var b = segment.v0;
        segment.v0 = segment.v1;
        segment.v1 = b;
    }
    var liminf = 0.17435839227423353;
    var limsup = 5.934119456780721;
    if (a > liminf && a < limsup) {
        segment.curveF = 1 / Math.tan(a / 2);
    }
}

function getStuffSegment(segment) {
    if (segment.curveF !== undefined) { // curveF
        var a = { x: segment.v1[0], y: segment.v1[1] },
            b = { x: segment.v0[0], y: segment.v0[1] },
            c = 0.5 * (a.x - b.x),
            a = 0.5 * (a.y - b.y),
            b = { x: segment.v0[0], y: segment.v0[1] },
            d = segment.curveF;
        segment.circleCenter = [b.x + c + -a * d, b.y + a + c * d];
        a = { x: segment.v0[0], y: segment.v0[1] };
        b = segment.circleCenter;
        c = a.x - b[0];
        a = a.y - b[1];
        segment.circleRadius = Math.sqrt(c * c + a * a);
        c = { x: segment.v0[0], y: segment.v0[1] };
        a = segment.circleCenter;
        segment.v0Tan = [-(c.y - a[1]), c.x - a[0]];
        c = segment.circleCenter;
        a = { x: segment.v1[0], y: segment.v1[1] };
        segment.v1Tan = [-(c[1] - a.y), c[0] - a.x];
        if (segment.curveF <= 0) {
            segment.v0Tan[0] *= -1;
            segment.v0Tan[1] *= -1;
            segment.v1Tan[0] *= -1;
            segment.v1Tan[1] *= -1;
        }
    }
    else {
        a = { x: segment.v0[0], y: segment.v0[1] };
        b = { x: segment.v1[0], y: segment.v1[1] };
        c = a.x - b.x;
        a = -(a.y - b.y);
        b = Math.sqrt(a * a + c * c);
        segment.normal = [a / b, c / b];
    }
}

function load_tile (name) {
    var tile = new Image(128, 128);
    tile.onload = function () {
        var ctx = canvas.getContext('2d');
        bg_patterns[name] = ctx.createPattern(tile, null);
        render(stadium);
    };
    tile.src = name + 'tile.png';
}

function resolvePlayerMovement(player) {
    if (player.disc != null) {
        var playerDisc = player.disc;
        if ((player.inputs & 16) != 0) {
            player.shooting = true;
        }
        else {
            player.shooting = false;
            player.shotReset = false;
        }
        if (checkKick(player)) {
            let g = false;
            discs.forEach((d) => {
                if ((d.cGroup & haxball.collisionFlags.kick) !== 0 && d != playerDisc) {
                    var t = { x: d.x, y: d.y },
                        h = { x: playerDisc.x, y: playerDisc.y },
                        e = haxball.playerPhysics,
                        m = t.x - h.x,
                        t = t.y - h.y,
                        h = Math.sqrt(m * m + t * t);
                    if (h - playerDisc.radius - d.radius < 4) {
                        var f = m / h,
                            m = t / h,
                            t = e.kickStrength;
                        d.xspeed = d.xspeed + f * t;
                        d.yspeed = d.yspeed + m * t;
    
                        // TODO : add kickback
    
                        g = true;
                    }
                }
            });
            if (g) {
                player.shotReset = true;;
                if (playerDisc.cMask !== 39) playerDisc.cMask = 39;
                // TODO : play sound
            }
        }
        var direction = [0, 0];
        if ((player.inputs & 1) != 0) direction[1]--;
        if ((player.inputs & 2) != 0) direction[0]--;
        if ((player.inputs & 4) != 0) direction[1]++;
        if ((player.inputs & 8) != 0) direction[0]++;
    
        direction = normalise(direction);
    
        playerDisc.xspeed = (playerDisc.xspeed + direction[0] * (checkKick(player) ? playerDisc.kickingAcceleration : playerDisc.acceleration));
        playerDisc.yspeed = (playerDisc.yspeed + direction[1] * (checkKick(player) ? playerDisc.kickingAcceleration : playerDisc.acceleration));
    }
}

function resolveDVCollision (disc, vertex) {
    var l = { x: disc.x, y: disc.y };
    var k = { x: vertex.x, y: vertex.y };
    var g = l.x - k.x;
    l = l.y - k.y;
    k = g * g + l * l;
    if (k > 0 && k <= disc.radius ** 2) {
        k = Math.sqrt(k);
        g = g / k;
        l = l / k;
        k = disc.radius - k;
        disc.x = disc.x + g * k;
        disc.y = disc.y + l * k;
        k = { x: disc.xspeed, y: disc.yspeed };
        k = g * k.x + l * k.y;
        if (k < 0) {
            k *= disc.bCoef * vertex.bCoef + 1;
            disc.xspeed = disc.xspeed - g * k;
            disc.yspeed = disc.yspeed - l * k;
        }
    }
}

function resolveDSCollision (disc, segment) {
    var b, c, d;
    if (segment.curveF === undefined) {
        b = { x: segment.v0[0], y: segment.v0[1] };
        var e = { x: segment.v1[0], y: segment.v1[1] };
        c = e.x - b.x;
        var f = e.y - b.y,
            g = { x: disc.x, y: disc.y };
        d = g.x - e.x;
        e = g.y - e.y;
        g = { x: disc.x, y: disc.y };
        if ((g.x - b.x) * c + (g.y - b.y) * f <= 0 || d * c + e * f >= 0) return;
        var norm = normalise([segment.v0[1] - segment.v1[1], segment.v1[0] - segment.v0[0]]);
        c = { x: -norm[0], y: -norm[1] };
        b = c.x;
        c = c.y;
        d = b * d + c * e;
    }
    else {
        c = segment.circleCenter;
        d = { x: disc.x, y: disc.y };
        b = d.x - c[0];
        c = d.y - c[1];
        d = segment.v1Tan;
        e = segment.v0Tan;
        if ((d[0] * b + d[1] * c && 0 < e[0] * b + e[1] * c) > 0 == segment.curveF <= 0) return;
        e = Math.sqrt(b * b + c * c);
        if (e == 0) return;
        d = e - segment.circleRadius;
        b /= e;
        c /= e;
    }
    if (d < 0) {
        d = -d;
        b = -b;
        c = -c;
    }
    if (d < disc.radius) {
        d = disc.radius - d;
        disc.x = disc.x + b * d;
        disc.y = disc.y + c * d;
        d = { x: disc.xspeed, y: disc.yspeed };
        d = b * d.x + c * d.y;
        if (d < 0) {
            d *= disc.bCoef * segment.bCoef + 1;
            disc.xspeed = disc.xspeed - b * d;
            disc.yspeed = disc.yspeed - c * d;
        }
    }
}

function resolveDPCollision (disc, plane) {
    var norm = normalise(plane.normal);
    var g = { x: norm[0], y: norm[1] },
        l = { x: disc.x, y: disc.y },
        g = plane.dist - (g.x * l.x + g.y * l.y) + disc.radius;
    if (g > 0) {
        disc.x = disc.x + norm[0] * g;
        disc.y = disc.y + norm[1] * g;
        g = { x: disc.xspeed, y: disc.yspeed };
        l = { x: norm[0], y: norm[1] };
        g = g.x * l.x + g.y * l.y;
        if (g < 0) {
            g *= disc.bCoef * plane.bCoef + 1;
            disc.xspeed = disc.xspeed - norm[0] * g;
            disc.yspeed = disc.yspeed - norm[1] * g;
        }
    }
}

function resolveDDCollision (disc1, disc2) {
    var b = { x: disc1.x, y: disc1.y },
        c = { x: disc2.x, y: disc2.y },
        d = b.x - c.x,
        b = b.y - c.y,
        e = disc1.radius + disc2.radius,
        f = d * d + b * b;
    if (f > 0 && f <= e * e) {
        var f = Math.sqrt(f),
            d = d / f,
            b = b / f,
            c = disc1.invMass / (disc1.invMass + disc2.invMass),
            e = e - f,
            f = e * c;
        disc1.x = disc1.x + d * f;
        disc1.y = disc1.y + b * f;
        e -= f;
        disc2.x = disc2.x - d * e;
        disc2.y = disc2.y - b * e;
        e = { x: disc1.xspeed, y: disc1.yspeed }
        f = { x: disc2.xspeed, y: disc2.yspeed }
        e = d * (e.x - f.x) + b * (e.y - f.y);
        if (e < 0) {
            e *= disc1.bCoef * disc2.bCoef + 1;
            c *= e;
            disc1.xspeed = disc1.xspeed - d * c;
            disc1.yspeed = disc1.yspeed - b * c;
            c = e - c;
            disc2.xspeed = disc2.xspeed + d * c;
            disc2.yspeed = disc2.yspeed + b * c;
        }
    }
}

function checkGoal (a, b) { // a : current position of scorable disc, b : position just before
    for (var c = 0, d = stadium.goals; c < d.length; c++) {
        var e = d[c];
        var f = e.p0,
            g = e.p1,
            l = b[0] - a[0],
            k = b[1] - a[1];
        if ((-(f[1] - a[1]) * l + (f[0] - a[0]) * k) * (-(g[1] - a[1]) * l + (g[0] - a[0]) * k) > 0) {
            f = false;
        }
        else {
            l = g[0] - f[0];
            g = g[1] - f[1];
            if ((-(a[1] - f[1]) * l + (a[0] - f[0]) * g) * (-(b[1] - f[1]) * l + (b[0] - f[0]) * g) > 0) {
                f = false;
            }
            else {
                f = true;
            }
        }
        if (f)
            return e.team;
    }
    return haxball.Team.SPECTATORS;
}

function endAnimation() {
    game.state = 3;
    game.timeout = 300;
}

function updateBar() {
    var a = Math.floor(game.time),
        b = a % 60,
        c = a / 60 | 0,
        spans = document.getElementsByClassName("digit");
    spans[3].textContent = "" + b % 10;
    spans[2].textContent = "" + (b / 10 | 0) % 10;
    spans[1].textContent = "" + c % 10;
    spans[0].textContent = "" + (c / 10 | 0) % 10;
    if (game.time > 60 * game.timeLimit - 30) {
        var span = document.getElementsByClassName("game-timer-view");
        span[0].className = "game-timer-view time-warn";
    }
    if (game.time > 60 * game.timeLimit) {
        var span = document.getElementsByClassName("game-timer-view time-warn");
        span[0].className = "game-timer-view";
        span = document.getElementsByClassName("overtime");
        span[0].className = "overtime on";
    }
    if (game.timeout > 0) {
        var scores = document.getElementsByClassName("score");
        scores[1].textContent = "" + game.blue;
        scores[0].textContent = "" + game.red;
    }
}

function drawMap () {
    resize_canvas();
}

function draw () {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    var b = discs;
    var c = 0;
    var d = discs;
    var e = 0;

    for (var g = d.length; e < g; e++) { // get all scorable discs
        var l = d[e];
        if ((l.cGroup & 128) != 0) {
            scorableDiscsId[c] = e;
            scorableDiscsPos[c][0] = l.x;
            scorableDiscsPos[c][1] = l.y;
            c++;
        }
    }

    playersArray.forEach((p) => {
        resolvePlayerMovement(p);
    });

    discs.forEach((d) => {
        d.x += d.xspeed;
        d.y += d.yspeed;
        d.xspeed *= d.damping;
        d.yspeed *= d.damping;
    });

    discs.forEach((d_a, i_a) => {
        discs.filter((_, i) => i > i_a).forEach((d_b) => {
            if (((d_a.cGroup & d_b.cMask) !== 0) && ((d_a.cMask & d_b.cGroup) !== 0)) {
                resolveDDCollision(d_a, d_b);
            }
        });
        if (d_a.invMass !== 0) {
            planes.forEach((p) => {
                if (((d_a.cGroup & p.cMask) !== 0) && ((d_a.cMask & p.cGroup) !== 0)) {
                        resolveDPCollision(d_a, p);
                }
            });
            segments.forEach((s) => {
                if (((d_a.cGroup & s.cMask) !== 0) && ((d_a.cMask & s.cGroup) !== 0)) {
                    resolveDSCollision(d_a, s);
                }
            });
            vertexes.forEach((v) => {
                if (((d_a.cGroup & v.cMask) !== 0) && ((d_a.cMask & v.cGroup) !== 0)) {
                    resolveDVCollision(d_a, v);
                }
            });
        }
    });

    if (game.state == 0) { // "kickOffReset"
        for (a = 0; a < b.length; a++) {
            c = b[a];
            if (c.x != null) c.cMask = 39 | 47;
        }
        b = b[0];
        if (b.xspeed * b.xspeed + b.yspeed * b.yspeed > 0) game.state = 1;
    }
    else if (game.state == 1) { // "gameInGoing"
        game.time += .016666666666666666;
        for (a = 0; a < b.length; a++) {
            d = b[a];
            if (d.x != null) d.cMask = 39;
        }
        d = haxball.Team.SPECTATORS;
        for (a = 0; a < c && d == haxball.Team.SPECTATORS; a++) {
            d = checkGoal([b[scorableDiscsId[a]].x, b[scorableDiscsId[a]].y], scorableDiscsPos[a]);
        }
        if (d != haxball.Team.SPECTATORS) {
            game.state = 2;
            game.timeout = 150; // animation timeout ?
            game.teamGoal = d;
            d.name == haxball.Team.BLUE.name ? game.red++ : game.blue++; // score update
        }
        else {
            if (game.timeLimit > 0 && game.time >= 60 * game.timeLimit && game.red != game.blue) {
                endAnimation();
            }
        }
    }
    else if (game.state == 2) { // "goalScored"
        game.timeout--;
        if (game.timeout <= 0) {
            if ((game.scoreLimit > 0 && (game.red >= game.scoreLimit || game.blue >= game.scoreLimit)) || game.timeLimit > 0 && game.time >= 60 * game.timeLimit && game.red != game.blue) {
                endAnimation();
            }
            else {
                resetPositionDiscs();
            }
        }
    }
    else if (game.state == 3) { // "gameEnding"
        document.location.reload(true);
        game.timeout--;
        if (game.timeout <= 0 && game.start) {
            game.start = false;
            for (var a = 0, c = playersArray; a < c.length; a++) {
                d = c[a];
                d.disc = null;
                d.spawnPoint = 0;
            }
        }
    }

    updateBar();
    drawMap();

    window.requestAnimationFrame(draw);
}

function Shape (type, object, i) {
    return { type: type, object: object, index: i };
}

function color_to_style (color, def) {
    if (!color) {
        return def ? def : 'rgb(0,0,0)';
    }
    else if (color.substr) {
        return '#' + color;
    }
    else {
        return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    }
}

function norm (v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function dist (a, b) {
    return norm([a[0] - b[0], a[1] - b[1]]);
}

function normalise (v) {
    var k = norm(v);
    var x = v[0] / (k || 1);
    var y = v[1] / (k || 1);
    return [x, y];
}

function render (st) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas_rect[2] - canvas_rect[0], canvas_rect[3] - canvas_rect[1]);
    setCameraFollow(null, playersArray[0].disc, canvas.width / zoom, canvas.height / zoom, 1 / 60);
    ctx.translate(-canvas_rect[0], -canvas_rect[1]);
    ctx.scale(window.devicePixelRatio * zoom, window.devicePixelRatio * zoom);
    ctx.translate(-cameraFollow.x, -cameraFollow.y);

    renderbg(st, ctx);
    drawPlayerDiscExtLine(playersArray[0].disc);

    segments.forEach((segment) => {
        if (segment.vis) {
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = color_to_style(segment.color, haxball.segment_color);
            var b = segment.v0,
                c = segment.v1;
            if (segment.curveF === undefined) {
                ctx.moveTo(b[0], b[1]);
                ctx.lineTo(c[0], c[1]);
            }
            else {
                var a = segment.circleCenter;
                var d = b[0] - a[0],
                    b = b[1] - a[1];
                ctx.arc(a[0], a[1], Math.sqrt(d * d + b * b), Math.atan2(b, d), Math.atan2(c[1] - a[1], c[0] - a[0]))
            }
            ctx.stroke();
        }
    });

    discs.forEach((disc, i) => {
        if (i < discs.length - playersArray.length) {
            ctx.beginPath();
            var radius = disc.radius;
            ctx.arc(disc.x, disc.y, radius, 0, Math.PI * 2, true);
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 2;
            ctx.fillStyle = color_to_style(disc.color, haxball.discPhysics.color);
            ctx.fill();
            ctx.stroke();
        }
    });

    playersArray.forEach((p, i) => {
        drawPlayerDisc(p);
        // if (i !== 0) insertNickCanvasGlobalCanvas(ctx, p.nicknameCanvasContext, p.disc.x, p.disc.y + 50);
    });

}

function renderbg (st, ctx) {
    var bg = st.bg;
    ctx.save();

    if (bg.type == 'grass' || bg.type == 'hockey') {

        ctx.fillStyle = haxball[bg.type].bg_color;
        ctx.fillRect(-st.width, -st.height, 2 * st.width, 2 * st.height);

        ctx.beginPath();

        ctx.moveTo(-bg.width + bg.cornerRadius, -bg.height);
        // TODO: Left border is wrong
        ctx.arcTo(bg.width, -bg.height, bg.width, -bg.height + bg.cornerRadius, bg.cornerRadius);
        ctx.arcTo(bg.width, bg.height, bg.width - bg.cornerRadius, bg.height, bg.cornerRadius);
        ctx.arcTo(-bg.width, bg.height, -bg.width, bg.height - bg.cornerRadius, bg.cornerRadius);
        ctx.arcTo(-bg.width, -bg.height, -bg.width + bg.cornerRadius, -bg.height, bg.cornerRadius);

        ctx.save();
        ctx.clip();
        ctx.translate(40, 40);
        ctx.fillStyle = bg_patterns[bg.type];
        ctx.fillRect(-st.width - 50, -st.height - 50, 2 * st.width - 40, 2 * st.height - 20);
        ctx.restore();

        ctx.moveTo(0, -bg.height);
        ctx.lineTo(0, bg.height);
        ctx.moveTo(bg.kickOffRadius, 0);
        ctx.arc(0, 0, bg.kickOffRadius, 0, Math.PI * 2, true);

        ctx.lineWidth = 3;
        ctx.strokeStyle = haxball[bg.type].border_color;
        ctx.stroke();
    }
    else {
        ctx.fillStyle = haxball.grass.bg_color;
        ctx.fillRect(-st.width, -st.height, 2 * st.width, 2 * st.height);
    }

    ctx.restore();
}

function for_all_shapes (st, types, f) {
    if (!f) {
        f = types;
        types = ['vertexes', 'segments', 'goals', 'discs', 'planes'];
    }
    types.forEach((name) => {
        var group = st[name];
        if (group) {
            group.forEach((obj, i) => {
                return f(Shape(name, obj, i));
            });
        }
    });
}

function resize_canvas () {
    var rect = [-stadium.width, -stadium.height, stadium.width, stadium.height];

    var consider = function (pt, r) {
        var x = pt[0];
        var y = pt[1];
        if (x - r < rect[0]) rect[0] = x - r;
        if (y - r < rect[1]) rect[1] = y - r;
        if (x + r > rect[2]) rect[2] = x + r;
        if (y + r > rect[3]) rect[3] = y + r;
    };

    for_all_shapes(stadium, function (shape) {
        var o = shape.object;
        switch (shape.type) {
            case 'vertexes':
                consider([o.x, o.y], 0);
                break;
            case 'goals':
                consider(o.p0, 0);
                consider(o.p1, 0);
                break;
            case 'discs':
                consider([o.x, o.y], o.radius);
                break;
        }
    });

    var canvas_div_size = [canvas.clientWidth, canvas.clientHeight];

    rect = [
        Math.round(Math.min(rect[0] - margin, -canvas_div_size[0] / 2)),
        Math.round(Math.min(rect[1] - margin, -canvas_div_size[1] / 2)),
        Math.round(Math.max(rect[2] + margin, canvas_div_size[0] / 2)),
        Math.round(Math.max(rect[3] + margin, canvas_div_size[1] / 2))
    ];

    canvas_rect = rect;
    canvas.width = document.body.offsetWidth;
    canvas.height = document.body.offsetHeight;

    render(stadium);
}

window.requestAnimationFrame(draw);
