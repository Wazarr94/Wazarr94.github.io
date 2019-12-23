// TODO : Better frame animation system
// TODO : Scores bar
// TODO : Clean-up
// TODO : Camera system
// TODO : Ability to have multiple players
// TODO : Menu
// TODO : Recording system

var canvas = document.getElementById("canvas_div");
var ctx = canvas.getContext("2d", { alpha: true });

var margin = 0;

//==== Program State

// cache of patterns
var bg_patterns = {};

// cached canvas size info
var canvas_rect = [-150, -75, 150, 75];

//===== Haxball Values

if (1) {
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
        red_color: 'rgb(229,110,86)',
        blue_color: 'rgb(86,137,229)',
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
            cGroup: ["red"]
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
    
    var zoom_levels = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5];
    var zoom = zoom_levels[3];
    
    
    var stadium = JSON.parse(`{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
    var stadiumP = JSON.parse(`{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1},{"bCoef":1,"dist":0,"normal":[-0.5,0.5]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
    var stadium2 = JSON.parse(`{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
    
    var stadium_copy = JSON.parse(JSON.stringify(stadium));
    
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
    
    var playerPhysics = stadium_copy.playerPhysics || {};
    for (const [key, value] of Object.entries(haxball.playerPhysics)) {
        if (playerPhysics[key] === undefined) playerPhysics[key] = value;
    }
    playerPhysics.pos = [-stadium.spawnDistance, 0];
    discs.push(collisionTransformation(playerPhysics));
    
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
}

var frameRate = 60;

var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var shotPressed = false;
var kickReset = false;

load_tile('grass');
load_tile('hockey');

discs[0].cGroup = 193;
playerPhysics.cMask = 47;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var nicknameCanvasCtx;
var avatarCanvasCtx;
var avatarPattern;

createAvatarCanvas();
getAvatarPattern("10");

function checkPointInSegment(x, y, v0, v1) {
    return ((x - v0[0]) * (x - v1[0]) + (y - v0[1]) * (y - v1[1]) <= 0);
}

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
    avatarCanvasCtx = a.getContext("2d", null);
    avatarPattern = avatarCanvasCtx.createPattern(avatarCanvasCtx.canvas, "no-repeat");
}

function getRGBA(a) {
    return "rgba(" + [(a & 16711680) >>> 16, (a & 65280) >>> 8, a & 255].join() + ",255)"
}

function checkKick() {
    if (kickReset) return !shotPressed;
    return shotPressed;
}

function getAvatarPattern(avatar) { // get avatar pattern
    var b = [15035990];
    if (b.length > 0) {
        avatarCanvasCtx.save();
        avatarCanvasCtx.translate(32, 32);
        avatarCanvasCtx.rotate(3.141592653589793 * 32 / 128);
        for (var c = -32, d = 64 / b.length, e = 0; e < b.length; e++) {
            avatarCanvasCtx.fillStyle = getRGBA(b[e]);
            avatarCanvasCtx.fillRect(c, -32, d + 4, 64);
            c += d;
        }
        avatarCanvasCtx.restore();
        avatarCanvasCtx.fillStyle = "white";
        avatarCanvasCtx.textAlign = "center";
        avatarCanvasCtx.textBaseline = "alphabetic";
        avatarCanvasCtx.font = "900 34px 'Arial Black','Arial Bold',Gadget,sans-serif";
        avatarCanvasCtx.fillText(avatar.substring(0, 2), 32, 44);
        avatarPattern = avatarCanvasCtx.createPattern(avatarCanvasCtx.canvas, "no-repeat");
    }
}

function drawPlayerDisc(player) { // draws (player) discs
    ctx.beginPath();
    ctx.fillStyle = avatarPattern;
    ctx.strokeStyle = checkKick() ? "white" : "black";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI, false);
    ctx.save();
    var c = player.radius / 32;
    ctx.translate(player.x, player.y);
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

function drawTextNickCanvas(nickname) { // draw text in nickname canvas
    nicknameCanvasCtx.resetTransform();
    nicknameCanvasCtx.clearRect(0, 0, 160, 34);
    nicknameCanvasCtx.font = "26px sans-serif";
    nicknameCanvasCtx.fillStyle = "white";
    if (nicknameCanvasCtx.measureText(nickname).width > 160) {
        nicknameCanvasCtx.textAlign = "left";
        nicknameCanvasCtx.translate(2, 29);
    }
    else {
        nicknameCanvasCtx.textAlign = "center";
        nicknameCanvasCtx.translate(80, 29);
    }
    nicknameCanvasCtx.fillText(nickname, 0, 0)
}

function insertNickCanvasGlobalCanvas(globalCtx, x, y) { // draw nickname canvas in global canvas
    globalCtx.drawImage(nicknameCanvasCtx.canvas, 0, 0, 160, 34, x - 40, y - 34, 80, 17)
}

function keyDownHandler (e) {
    if (e.code == "ArrowRight") {
        rightPressed = true;
    }
    if (e.code == "ArrowLeft") {
        leftPressed = true;
    }
    if (e.code == "ArrowUp") {
        upPressed = true;
    }
    if (e.code == "ArrowDown") {
        downPressed = true;
    }
    if (e.code == "KeyX") {
        shotPressed = true;
    }
    if (e.code == "Digit1") {
        zoom = zoom_levels[0];
    }
    if (e.code == "Digit2") {
        zoom = zoom_levels[1];
    }
    if (e.code == "Digit3") {
        zoom = zoom_levels[2];
    }
    if (e.code == "Digit4") {
        zoom = zoom_levels[3];
    }
    if (e.code == "Digit5") {
        zoom = zoom_levels[4];
    }
    if (e.code == "Digit6") {
        zoom = zoom_levels[5];
    }
    if (e.code == "Digit7") {
        zoom = zoom_levels[6];
    }
}

function keyUpHandler (e) {
    if (e.code == "ArrowRight") {
        rightPressed = false;
    }
    if (e.code == "ArrowLeft") {
        leftPressed = false;
    }
    if (e.code == "ArrowUp") {
        upPressed = false;
    }
    if (e.code == "ArrowDown") {
        downPressed = false;
    }
    if (e.code == "KeyX") {
        shotPressed = false;
        kickReset = false;
    }
}

function collisionTransformation (physics, vertexes = null) {
    var cMask = physics.cMask;
    var y = 0;
    cMask.forEach((x) => {
        y |= haxball.collisionFlags[x];
    });
    physics.cMask = y;
    var cGroup = physics.cGroup;
    y = 0;
    cGroup.forEach((x) => {
        y |= haxball.collisionFlags[x];
    });
    physics.cGroup = y;
    // physics["color"] = parseInt(physics["color"], 16);
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
    segment.curve *= .017453292519943295;
    if (segment.curve < 0) {
        segment.curve *= -1;
        var b = segment.v0;
        segment.v0 = segment.v1;
        segment.v1 = b;
    }
    var liminf = 0.17435839227423353;
    var limsup = 5.934119456780721;
    if (segment.curve > liminf && segment.curve < limsup) {
        segment.curveF = 1 / Math.tan(segment.curve / 2);
        delete segment.curve;
    }
}

function getStuffSegment(segment) {
    if (segment.curveF !== undefined) { // curveF
        var a = { x: segment.v1[0], y: segment.v1[1] },
            b = { x: segment.v0[0], y: segment.v0[1] },
            c = .5 * (a.x - b.x),
            a = .5 * (a.y - b.y),
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
    if (checkKick()) {
        let g = false;
        discs.forEach((d) => {
            if ((d.cGroup & haxball.collisionFlags.kick) !== 0 && d != player) {
                var t = { x: d.x, y: d.y },
                    h = { x: player.x, y: player.y }, // (joueur)
                    e = haxball.playerPhysics,
                    m = t.x - h.x,
                    t = t.y - h.y,
                    h = Math.sqrt(m * m + t * t);
                if (4 > h - player.radius - d.radius) { // dist inf a 4 + radA + radB
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
            kickReset = true;
            if (player.cMask !== 39) player.cMask = 39;
            // TODO : play sound
        }
    }
    var direction = [0, 0];
    if (rightPressed) direction[0]++;
    if (leftPressed) direction[0]--;
    if (downPressed) direction[1]++;
    if (upPressed) direction[1]--;

    direction = normalise(direction);

    player.xspeed = (player.xspeed + direction[0] * (checkKick() ? playerPhysics.kickingAcceleration : playerPhysics.acceleration));
    player.yspeed = (player.yspeed + direction[1] * (checkKick() ? playerPhysics.kickingAcceleration : playerPhysics.acceleration));
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
    if (segment.curveF === undefined) { // no curveF
        b = { x: segment.v0[0], y: segment.v0[1] }; // v0
        var e = { x: segment.v1[0], y: segment.v1[1] }; // v1
        c = e.x - b.x; // distx v0v1
        var f = e.y - b.y, // disty v0v1
            g = { x: disc.x, y: disc.y }; // disc
        d = g.x - e.x; // distx v1disc
        e = g.y - e.y; // disty v1disc
        g = { x: disc.x, y: disc.y };
        if (0 >= (g.x - b.x) * c + (g.y - b.y) * f || 0 <= d * c + e * f)
            return;
        var norm = normalise([segment.v0[1] - segment.v1[1], segment.v1[0] - segment.v0[0]]);
        c = { x: -norm[0], y: -norm[1] }; // normal
        b = c.x; // normx
        c = c.y; // normy
        d = b * d + c * e;
    }
    else {
        c = segment.circleCenter; // center of the circle 
        d = { x: disc.x, y: disc.y }; // disc
        b = d.x - c[0];
        c = d.y - c[1];
        d = segment.v1Tan;
        e = segment.v0Tan;
        if ((0 < d[0] * b + d[1] * c && 0 < e[0] * b + e[1] * c) == 0 >= segment.curveF)
            return;
        e = Math.sqrt(b * b + c * c);
        if (e == 0)
            return;
        d = e - segment.circleRadius;
        b /= e;
        c /= e
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
    var g = { x: norm[0], y: norm[1] }, // normal
        l = { x: disc.x, y: disc.y }, // disc pos
        g = plane.dist - (g.x * l.x + g.y * l.y) + disc.radius; // dist - () + radius
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
    var b = { x: disc1.x, y: disc1.y }, // disc1 pos
        c = { x: disc2.x, y: disc2.y }, // disc2 pos
        d = b.x - c.x,
        b = b.y - c.y,
        e = disc1.radius + disc2.radius, // radius sum
        f = d * d + b * b;
    if (f > 0 && f <= e * e) {
        if ((disc1.cGroup & 1) !== 0 || (disc2.cGroup & 1) !== 0 && playerPhysics.cMask !== 39) playerPhysics.cMask = 39;
        var f = Math.sqrt(f),
            d = d / f,
            b = b / f,
            c = disc1.invMass / (disc1.invMass + disc2.invMass), // mass
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

function drawMap () {
    resize_canvas();
}

function draw () {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    
    resolvePlayerMovement(playerPhysics);

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

    drawMap();
}

function segment_arc (st, segment) {
    var seg = segment_points(st, segment);
    var arc = data(segment, 'arc');
    if (arc && arc.a[0] == seg.a[0] && arc.a[1] == seg.a[1] &&
        arc.b[0] == seg.b[0] && arc.b[1] == seg.b[1] && arc.curve == segment.curve) {
        return arc;
    }
    arc = { a: seg.a, b: seg.b, curve: segment.curve };
    var curve = segment.curve;
    $.extend(arc, calculate_arc(seg.a, seg.b, curve));
    data(segment, 'arc', arc);
    return arc;
}

function calculate_arc (a, b, curve) {
    var arc = {};
    if (curve === 0)
        return arc;
    if (curve < 0) {
        curve = -curve;
        var c = a;
        a = b;
        b = c;
    }

    var c = [b[0] - a[0], b[1] - a[1]];
    var d = [a[0] + c[0] / 2, a[1] + c[1] / 2];
    var nc = norm(c);

    if (curve == 180) {
        arc.radius = nc / 2;
        arc.center = d;
        arc.from = angle_to(d, a);
        arc.to = angle_to(d, b);
        return arc;
    }

    // |a-b| / sin A = r / sin (90 - A/2)
    var angle = curve * Math.PI / 180;
    var spa2 = Math.sin(Math.PI / 2 - angle / 2);
    var radius = Math.abs(nc * spa2 / Math.sin(angle));


    var cp = normalise([c[1], -c[0]]);

    var l = Math.sqrt((nc * nc / 4) + radius * radius - nc * radius * Math.cos(Math.PI / 2 - angle / 2));

    if (curve > 180)
        l = -l;

    arc.radius = radius;

    arc.center = [
        d[0] - cp[0] * l,
        d[1] - cp[1] * l
    ];

    arc.from = angle_to(arc.center, a);
    arc.to = angle_to(arc.center, b);

    return arc;
}

function angle_to (o, p) {
    return Math.atan2(p[1] - o[1], p[0] - o[0]);
}

function Shape (type, object, i) {
    return { type: type, object: object, index: i };
}

function segment_points (st, segment) {
    var a = st.vertexes[segment.v0];
    var b = st.vertexes[segment.v1];
    return {
        a: [a.x, a.y],
        b: [b.x, b.y]
    };
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

function data (obj, k, v) {
    if (v === undefined) {
        return obj._data ? obj._data[k] : undefined;
    }
    if (!obj._data) obj._data = {};
    obj._data[k] = v;
}

function complete (st, o) {
    if (o.trait) {
        return $.extend({}, st.traits[o.trait], o);
    }
    return $.extend({}, o);
}

function render (st) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas_rect[2] - canvas_rect[0], canvas_rect[3] - canvas_rect[1]);
    ctx.translate(-canvas_rect[0], -canvas_rect[1]);
    ctx.scale(window.devicePixelRatio * zoom, window.devicePixelRatio * zoom);

    renderbg(st, ctx);

    $.each(st.segments, function (i, segment) {
        segment = complete(st, segment);
        render_segment_arc(ctx, segment, segment_arc(st, segment));
    });

    $.each(discs, function (i, disc) {
        if (i !== discs.length - 1) {
            ctx.beginPath();
            var radius = disc.radius;
            ctx.arc(disc.x, disc.y, radius, 0, Math.PI * 2, true);
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 2;
            ctx.fillStyle = color_to_style(disc.color, haxball.discPhysics.color);
            ctx.fill();
            ctx.stroke();
        }
        else {

            drawPlayerDisc(playerPhysics);
            drawPlayerDiscExtLine(playerPhysics);

            // createNickCanvas();
            // drawTextNickCanvas("Malinx");
            // insertNickCanvasGlobalCanvas(ctx, playerPhysics.x, playerPhysics.y + 50);
        }
    });

}

function render_segment_arc (ctx, segment, arc) {
    ctx.beginPath();
    if (arc.curve) {
        ctx.arc(arc.center[0], arc.center[1], arc.radius, arc.from, arc.to, false);
    }
    else {
        ctx.moveTo(arc.a[0], arc.a[1]);
        ctx.lineTo(arc.b[0], arc.b[1]);
    }

    if (segment.vis !== false) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = color_to_style(segment.color, haxball.segment_color);
        ctx.stroke();
    }
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

    $.each(types, function (i, name) {
        var group = st[name];
        if (group) {
            $.each(group, function (i, obj) {
                return f(Shape(name, obj, i));
            });
        }
    });
}

function resize_canvas () {
    var st = stadium;

    var rect;

    rect = [-st.width, -st.height, st.width, st.height];

    var consider = function (pt, r) {
        var x = pt[0];
        var y = pt[1];
        if (x - r < rect[0]) rect[0] = x - r;
        if (y - r < rect[1]) rect[1] = y - r;
        if (x + r > rect[2]) rect[2] = x + r;
        if (y + r > rect[3]) rect[3] = y + r;
    };

    for_all_shapes(stadium, function (shape) {
        var obj = shape.object;
        var o = complete(st, obj);
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

    var cd = $('#canvas_div');
    var canvas_div_size = [cd.innerWidth(), cd.innerHeight()];

    rect = [
        Math.round(Math.min(rect[0] - margin, -canvas_div_size[0] / 2)),
        Math.round(Math.min(rect[1] - margin, -canvas_div_size[1] / 2)),
        Math.round(Math.max(rect[2] + margin, canvas_div_size[0] / 2)),
        Math.round(Math.max(rect[3] + margin, canvas_div_size[1] / 2))
    ];

    canvas_rect = rect;
    // var wh = { width: rect[2] - rect[0], height: rect[3] - rect[1] };
    var wh = { width: document.body.offsetWidth, height: document.body.offsetHeight };

    $(canvas).attr(wh);
    $(canvas).css(wh);

    render(stadium);
}

var interval = setInterval(draw, 1000 / frameRate);
