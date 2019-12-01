// TODO : Collision system with cMask, cGroup, binary stuff
// TODO : Finish physics system
// TODO : Better frame animation system
// TODO : FIX ANTIALIASING + avatar -> antialiasing DONE
// TODO : Menu
// TODO : Recording system which lets us test physics

var canvas = document.getElementById("canvas_div");
var ctx = canvas.getContext("2d", { alpha: true });

ctx.direction = "ltr";
ctx.filter = "none";
ctx.font = "10px sans-serif";
ctx.globalAlpha = 1;
ctx.globalCompositeOperation = "source-over";
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "low";
ctx.lineCap = "butt";
ctx.lineDashOffset = 0;
ctx.lineJoin = "miter";
ctx.miterLimit = 10;
ctx.mozImageSmoothingEnabled = false;;
ctx.shadowBlur = 0;
ctx.shadowColor = "rgba(0, 0, 0, 0)";
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

var margin = 0;

//==== Program State

// cache of patterns
var bg_patterns = {};

// cached canvas size info
var canvas_rect = [-150, -75, 150, 75];

//===== Haxball Values

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

var zoom_levels = [1, 1.25, 1.5];
var zoom = zoom_levels[0];

var properties = (function (p) {
    return {
        bCoef: p(false, 'number'),
        speed: p(false, 'point'),
        cMask: p(false, 'layers'),
        cGroup: p(false, 'layers'),
        trait: p(false, 'trait'),
        x: p(true, 'number', true),
        y: p(true, 'number', true),
        v0: p(true, 'ref', true),
        v1: p(true, 'ref', true),
        curve: p(true, 'number'),
        vis: p(false, 'bool'),
        color: p(false, 'color'),
        normal: p(true, 'point', true),
        dist: p(true, 'number', true),
        radius: p(false, 'number'),
        invMass: p(false, 'number'),
        pos: p(true, 'point'),
        p0: p(true, 'point', true),
        p1: p(true, 'point', true),
        team: p(true, 'team'),
        damping: p(true, 'number')
    };
})(function (required, type, nodefault) {
    return { required: required, type: type, def: !nodefault };
});

var type_properties = {
    vertexes: ['x', 'y', 'bCoef', 'cMask', 'cGroup', 'trait'],
    segments: ['v0', 'v1', 'curve', 'vis', 'color', 'bCoef', 'cMask', 'cGroup', 'trait'],
    planes: ['normal', 'dist', 'bCoef', 'cMask', 'cGroup', 'trait'],
    discs: ['radius', 'invMass', 'pos', 'color', 'bCoef', 'cMask', 'cGroup', 'trait', 'damping', 'speed'],
    goals: ['p0', 'p1', 'team']
};

var stadium = JSON.parse(`{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
var stadium2 = JSON.parse(`{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);

var discs = [];

var ballPhysics = haxball.ballPhysics;
if (stadium.ballPhysics !== undefined) {
    for (const [key, value] of Object.entries(haxball.ballPhysics)) {
        ballPhysics[key] = stadium.ballPhysics[key] == undefined ? value : stadium.ballPhysics[key];
    }
}
discs.push(collisionTransformation(ballPhysics));

stadium.discs.forEach((d) => {
    for (const [key, value] of Object.entries(haxball.discPhysics)) {
        if (d[key] === undefined) d[key] = value;
    }
    if (d["trait"] !== undefined) {
        for (const [key, value] of Object.entries(stadium.traits[d["trait"]])) {
            d[key] = value;
        }
    }
    discs.push(collisionTransformation(d));
});

var playerPhysics = haxball.playerPhysics;
if (stadium.playerPhysics !== undefined) {
    for (const [key, value] of Object.entries(haxball.playerPhysics)) {
        playerPhysics[key] = stadium.playerPhysics[key] == undefined ? value : stadium.playerPhysics[key];
    }
}
playerPhysics["pos"] = [-stadium.spawnDistance, 0];

discs.push(collisionTransformation(playerPhysics));

var segments = stadium.segments;
segments.forEach((s) => {

});

var frameRate = 60;

var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var shotPressed = false;

load_tile('grass');
load_tile('hockey');

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

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
    }
}

function collisionTransformation (physics) {
    var cMask = physics["cMask"];
    var y = 0;
    cMask.forEach((x) => {
        y |= haxball.collisionFlags[x];
    });
    physics["cMask"] = y;
    var cGroup = physics["cGroup"];
    y = 0;
    cGroup.forEach((x) => {
        y |= haxball.collisionFlags[x];
    });
    physics["cGroup"] = y;
    // physics["color"] = parseInt(physics["color"], 16);
    physics.x = physics.pos[0];
    physics.y = physics.pos[1];
    physics.xspeed = 0;
    physics.yspeed = 0;
    delete physics.pos;
    delete physics["trait"];
    return physics;
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

function rotate (xspeed, yspeed, angle) {
    const rotatedVelocities = [
        xspeed * Math.cos(angle) - yspeed * Math.sin(angle),
        xspeed * Math.sin(angle) + yspeed * Math.cos(angle)
    ];
    return rotatedVelocities;
}

function resolveCollision (disc1, disc2) {
    const xVelocityDiff = disc1.xspeed - disc2.xspeed;
    const yVelocityDiff = disc1.yspeed - disc2.yspeed;

    const xDist = disc2.x - disc1.x;
    const yDist = disc2.y - disc1.y;

    if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

        const angle = -Math.atan2(disc2.y - disc1.y, disc2.x - disc1.x);

        const m1 = 1 / disc1.invMass;
        const m2 = 1 / disc2.invMass;

        const u1 = rotate(disc1.xspeed, disc1.yspeed, angle);
        const u2 = rotate(disc2.xspeed, disc2.yspeed, angle);

        const v1 = { x: (disc1.bCoef * m2 * (u2[0] - u1[0]) + m1 * u1[0] + m2 * u2[0]) / (m1 + m2), y: u1[1] };
        const v2 = { x: (disc2.bCoef * m1 * (u1[0] - u2[0]) + m1 * u1[0] + m2 * u2[0]) / (m1 + m2), y: u2[1] };

        const vFinal1 = rotate(v1.x, v1.y, -angle);
        const vFinal2 = rotate(v2.x, v2.y, -angle);

        disc1.xspeed = vFinal1[0];
        disc1.yspeed = vFinal1[1];

        disc2.xspeed = vFinal2[0];
        disc2.yspeed = vFinal2[1];
    }
}

function drawMap () {
    resize_canvas();
}

function draw () {
    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    drawMap();

    var direction = [0, 0];

    if (rightPressed && playerPhysics["x"] < stadium.width - playerPhysics.radius) {
        direction[0]++;
    }
    if (leftPressed && playerPhysics["x"] > -stadium.width + playerPhysics.radius) {
        direction[0]--;
    }
    if (downPressed && playerPhysics["y"] < stadium.height - playerPhysics.radius) {
        direction[1]++;
    }
    if (upPressed && playerPhysics["y"] > -stadium.height + playerPhysics.radius) {
        direction[1]--;
    }

    direction = normalise(direction);

    playerPhysics["xspeed"] = (playerPhysics["xspeed"] + direction[0] * (shotPressed ? playerPhysics.kickingAcceleration : playerPhysics.acceleration));
    playerPhysics["yspeed"] = (playerPhysics["yspeed"] + direction[1] * (shotPressed ? playerPhysics.kickingAcceleration : playerPhysics.acceleration));

    discs.forEach((d_a, i_a) => {
        discs.filter((_, i) => i > i_a).forEach((d_b) => {
            if (dist([d_a.x, d_a.y], [d_b.x, d_b.y]) <= d_a.radius + d_b.radius) {
                resolveCollision(d_a, d_b);
            }
        });
    });

    discs.forEach((d) => {
        d.xspeed *= d.damping;
        d.yspeed *= d.damping;
        d.x += d.xspeed;
        d.y += d.yspeed;
        if (d["x"] > stadium.width - d.radius) {
            d["x"] = stadium.width - d.radius;
            d["xspeed"] = 0;
        }
        if (d["x"] < -stadium.width + d.radius) {
            d["x"] = -stadium.width + d.radius;
            d["xspeed"] = 0;
        }
        if (d["y"] > stadium.height - d.radius) {
            d["y"] = stadium.height - d.radius;
            d["yspeed"] = 0;
        }
        if (d["y"] < -stadium.height + d.radius) {
            d["y"] = -stadium.height + d.radius;
            d["yspeed"] = 0;
        }
    });

    ctx.beginPath();
    ctx.moveTo(playerPhysics.x + playerPhysics.radius + 10, playerPhysics.y);
    ctx.strokeStyle = 'rgb(255,255,255)';
    ctx.globalAlpha = 0.3;
    ctx.arc(playerPhysics.x, playerPhysics.y, playerPhysics.radius + 10, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.arc(playerPhysics.x, playerPhysics.y, playerPhysics.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = haxball.red_color;
    ctx.strokeStyle = shotPressed ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.clip();
    ctx.font = "bold 14pt sans-serif";
    var avatar = "2";
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.textAlign = 'center';
    ctx.textBaseline = "middle";
    ctx.fillText(avatar, playerPhysics.x, playerPhysics.y);
    ctx.closePath();

    // // draw red
    // ctx.beginPath();
    // ctx.arc(playerPhysics.x, playerPhysics.y, playerPhysics.radius, 0, Math.PI*2, true);
    // ctx.fillStyle = haxball.red_color;
    // ctx.strokeStyle = shotPressed ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
    // ctx.lineWidth = 2;
    // ctx.fill();
    // ctx.stroke();
    // // ctx.clip();
    // // ctx.font = "16px sans-serif";
    // // ctx.fillStyle = 'rgb(255,255,255)';
    // // ctx.fillText("1", playerPhysics["x"] - 5, playerPhysics["y"] + 5);
    // ctx.closePath();

    // ctx.beginPath();
    // ctx.moveTo(playerPhysics["x"] + playerPhysics.radius + 10, playerPhysics["y"]);
    // ctx.strokeStyle = 'rgb(255,255,255)';
    // ctx.globalAlpha = 0.3;
    // ctx.arc(playerPhysics["x"], playerPhysics["y"], playerPhysics.radius + 10, 0, Math.PI*2, true);
    // ctx.stroke();
    // ctx.closePath();
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

    $.each(st.discs, function (i, disc) {
        disc = complete(st, disc);
        ctx.beginPath();
        var radius = disc.radius !== undefined ? disc.radius : haxball.discPhysics.radius;
        ctx.arc(disc.x, disc.y, radius, 0, Math.PI * 2, true);
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.lineWidth = 2;
        ctx.fillStyle = color_to_style(disc.color, haxball.discPhysics.color);
        ctx.fill();
        ctx.stroke();
    });

    // draw puck
    ctx.beginPath();
    ctx.arc(discs[0].x, discs[0].y, ballPhysics.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = color_to_style(ballPhysics.color);
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

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
