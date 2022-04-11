// TODO : Finish frame animation (include time)
// TODO : Goal announcements
// TODO : Clean-up
// TODO : Chat (for commands)
// TODO : Menu
// TODO : Improve recording system

if (localStorage.getItem('rec') == null) localStorage.setItem('rec', '0');

var canvas = document.getElementById('canvas_div');
var ctx = canvas.getContext('2d', { alpha: true });

var margin = 0;
var reloadCheck = false;
var lastTick = 0;

var goalSound = new Audio("audio/goal.mp3");

//==== Program State

// cache of patterns
var bg_patterns = {};

// cached canvas size info

var canvas_rect = [-150, -75, 150, 75];

//===== Haxball Values

function Player() {}
function Disc() {}
function Game() {}

Disc.prototype = {
    ballPhysics: function () {
        this.radius = 10;
        this.bCoef = 0.5;
        this.invMass = 1;
        this.damping = 0.99;
        this.color = 'FFFFFF';
        this.x = 0;
        this.y = 0;
        this.xspeed = 0;
        this.yspeed = 0;
        this.cGroup = 193;
        this.cMask = 63;
    },
    playerPhysics: function () {
        this.radius = 2;
        this.bCoef = 0.5;
        this.invMass = 0.5;
        this.damping = 0.96;
        this.acceleration = 0.1;
        this.kickingAcceleration = 0.07;
        this.kickingDamping = 0.96;
        this.kickStrength = 5;
        this.color = 'FFFFFF';
        this.x = 0;
        this.y = 0;
        this.xspeed = 0;
        this.yspeed = 0;
        this.cGroup = 0;
        this.cMask = 39;
    },
};

Game.prototype = {
    init: function () {
        this.state = 0;
        this.start = true;
        this.timeout = 0;
        this.timeLimit = 1;
        this.scoreLimit = 1;
        this.kickoffReset = 8;
        this.red = 0;
        this.blue = 0;
        this.time = 0;
        this.teamGoal = haxball.Team.SPECTATORS;
    },
};

Player.prototype = {
    default: function () {
        this.disc = null;
        this.name = 'Player';
        this.team = haxball.Team.SPECTATORS;
        this.avatar = '';
        var a = window.document.createElement('canvas');
        var b = window.document.createElement('canvas');
        this.avatarContext = a.getContext('2d', null);
        this.avatarPattern = getAvatarPattern(this.avatarContext, this.avatar, [
            getRGBA(haxball.Team.BLUE.color),
        ]);
        this.nicknameCanvasContext = drawTextNickCanvas(
            b.getContext('2d', null),
            this.name
        );
        this.inputs = 0;
        this.shooting = false;
        this.shotReset = false;
        this.spawnPoint = 0;
        this.controls = [
            ['ArrowUp'],
            ['ArrowLeft'],
            ['ArrowDown'],
            ['ArrowRight'],
            ['KeyX'],
        ];
        this.bot = false;
    },
    init: function (name, avatar, team, controls, bot = false) {
        this.default();
        if (name != undefined) {
            this.name = name;
            var b = window.document.createElement('canvas');
            this.nicknameCanvasContext = drawTextNickCanvas(
                b.getContext('2d', null),
                name
            );
        }
        if (team != undefined) {
            this.team = team;
        }
        if (avatar != undefined) {
            this.avatar = avatar;
            this.avatarContext = createAvatarCanvas();
            this.avatarPattern = getAvatarPattern(
                this.avatarContext,
                this.avatar,
                this.team === haxball.Team.BLUE
                    ? [getDecimalFromRGB(haxball.Team.BLUE.color)]
                    : [getDecimalFromRGB(haxball.Team.RED.color)]
            );
        }
        if (controls != undefined) this.controls = controls;
        if (bot != undefined) this.bot = bot;
    },
};
// values hardcoded in haxball
var haxball = {
    hockey: {
        bg_color: 'rgb(85, 85, 85)',
        border_color: 'rgb(233,204,110)',
    },
    grass: {
        bg_color: 'rgb(113,140,90)',
        border_color: 'rgb(199,230,189)',
    },
    segment_color: 'rgb(0,0,0)',
    Team: {
        RED: {
            name: 't-red',
            id: 1,
            color: 'rgb(229, 110, 86)',
            cGroup: 2,
        },
        BLUE: {
            name: 't-blue',
            id: 2,
            color: 'rgb(86,137,229)',
            cGroup: 4,
        },
        SPECTATORS: {
            name: 't-spectators',
            id: 0,
            color: null,
            cGroup: 0,
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
        cMask: ['all'],
        cGroup: [''],
    },
    ballPhysics: {
        radius: 10,
        bCoef: 0.5,
        invMass: 1,
        damping: 0.99,
        color: 'FFFFFF',
        pos: [0, 0],
        cMask: ['all'],
        cGroup: ['ball'],
    },
    discPhysics: {
        radius: 10,
        bCoef: 0.5,
        invMass: 0,
        damping: 0.99,
        color: 'rgb(255,255,255)',
        cMask: ['all'],
        cGroup: ['all'],
    },
    segmentPhysics: {
        curve: 0,
        bCoef: 1,
        cGroup: ['wall'],
        cMask: ['all'],
    },
    planePhysics: {
        bCoef: 1,
        cGroup: ['wall'],
        cMask: ['all'],
    },
    vertexPhysics: {
        bCoef: 1,
        cGroup: ['wall'],
        cMask: ['all'],
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
        wall: 32,
    },
};

var zoom_levels = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5];
var zoom = zoom_levels[4];

const Input = { LEFT: 2, RIGHT: 8, UP: 1, DOWN: 4, SHOOT: 16 };
const Kick = {
    PASS: 0,
    REBOUND_PASS: 1,
    REBOUND_DRIBBLE: 2,
    CLEAR: 3,
    SHOT: 4,
    ROCKET: 5,
    OPEN_DUEL: 6,
    CORNER_DUEL: 7,
};
const Team = {
    SPECTATORS: 0,
    RED: 1,
    BLUE: 2,
};

var stadium = JSON.parse(
    `{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`
);
var stadiumP = JSON.parse(
    `{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1},{"bCoef":1,"dist":0,"normal":[-0.5,0.5]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`
);
var stadium2 = JSON.parse(
    `{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`
);
var stadiumF = JSON.parse(
    `{"name":"BFF Big v3","width":800,"height":350,"bg":{"type":"","kickOffRadius":80,"color":"34414b"},"vertexes":[{"x":-701.4,"y":-320,"trait":"vertexDefault"},{"x":701.4,"y":-320,"trait":"vertexDefault"},{"x":701.4,"y":320,"trait":"vertexDefault"},{"x":-701.4,"y":320,"trait":"vertexDefault"},{"x":0,"y":320,"trait":"vertexDefault"},{"x":0,"y":-320,"trait":"vertexDefault"},{"x":0,"y":-80,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"vertexDefault"},{"x":0,"y":80,"cMask":["red","blue"],"cGroup":["redKO","blueKO"],"trait":"vertexDefault"},{"x":-700,"y":85,"trait":"vertexDefault"},{"x":-700,"y":-320,"trait":"vertexDefault"},{"x":-700,"y":320,"trait":"vertexDefault"},{"x":-700,"y":-85,"trait":"vertexDefault"},{"x":700,"y":-85,"trait":"vertexDefault"},{"x":700,"y":85,"trait":"vertexDefault"},{"x":0,"y":350,"trait":"vertexDefault"},{"x":0,"y":-350,"trait":"vertexDefault"},{"x":736.4,"y":-85,"trait":"vertexDefault"},{"x":736.4,"y":85,"trait":"vertexDefault"},{"x":-736.4,"y":-85,"trait":"vertexDefault"},{"x":-736.4,"y":85,"trait":"vertexDefault"},{"x":-360,"y":-318.5,"trait":"vertexDefault"},{"x":-360,"y":318.5,"trait":"vertexDefault"},{"x":360,"y":-318.5,"trait":"vertexDefault"},{"x":360,"y":318.5,"trait":"vertexDefault"},{"x":0,"y":-1.5,"trait":"vertexDefault"},{"x":0,"y":1.5,"trait":"vertexDefault"},{"x":698.5,"y":125,"trait":"vertexDefault"},{"x":698.5,"y":-125,"trait":"vertexDefault"},{"x":628.6,"y":-125,"trait":"vertexDefault"},{"x":628.6,"y":125,"trait":"vertexDefault"},{"x":360,"y":-135,"trait":"vertexDefault"},{"x":360,"y":135,"trait":"vertexDefault"},{"x":-360,"y":-135,"trait":"vertexDefault"},{"x":-360,"y":135,"trait":"vertexDefault"},{"x":-698.5,"y":125,"trait":"vertexDefault"},{"x":-628.4,"y":125,"trait":"vertexDefault"},{"x":-628.6,"y":-125,"trait":"vertexDefault"},{"x":-698.5,"y":-125,"trait":"vertexDefault"},{"x":-500,"y":1.5,"trait":"vertexDefault"},{"x":-500,"y":-1.5,"trait":"vertexDefault"},{"x":500,"y":1.5,"trait":"vertexDefault"},{"x":500,"y":-1.5,"trait":"vertexDefault"},{"x":-702.5,"y":-85,"trait":"vertexDefault"},{"x":-705,"y":-85,"trait":"vertexDefault"},{"x":-707.5,"y":-85,"trait":"vertexDefault"},{"x":-710,"y":-85,"trait":"vertexDefault"},{"x":-712.5,"y":-85,"trait":"vertexDefault"},{"x":-715,"y":-85,"trait":"vertexDefault"},{"x":-717.5,"y":-85,"trait":"vertexDefault"},{"x":-720,"y":-85,"trait":"vertexDefault"},{"x":-722.5,"y":-85,"trait":"vertexDefault"},{"x":-725,"y":-85,"trait":"vertexDefault"},{"x":-727.5,"y":-85,"trait":"vertexDefault"},{"x":-730,"y":-85,"trait":"vertexDefault"},{"x":-732.5,"y":-85,"trait":"vertexDefault"},{"x":-735,"y":-85,"trait":"vertexDefault"},{"x":-702.5,"y":85,"trait":"vertexDefault"},{"x":-705,"y":85,"trait":"vertexDefault"},{"x":-707.5,"y":85,"trait":"vertexDefault"},{"x":-710,"y":85,"trait":"vertexDefault"},{"x":-712.5,"y":85,"trait":"vertexDefault"},{"x":-715,"y":85,"trait":"vertexDefault"},{"x":-717.5,"y":85,"trait":"vertexDefault"},{"x":-720,"y":85,"trait":"vertexDefault"},{"x":-722.5,"y":85,"trait":"vertexDefault"},{"x":-725,"y":85,"trait":"vertexDefault"},{"x":-727.5,"y":85,"trait":"vertexDefault"},{"x":-730,"y":85,"trait":"vertexDefault"},{"x":-732.5,"y":85,"trait":"vertexDefault"},{"x":-735,"y":85,"trait":"vertexDefault"},{"x":702.5,"y":85,"trait":"vertexDefault"},{"x":705,"y":85,"trait":"vertexDefault"},{"x":707.5,"y":85,"trait":"vertexDefault"},{"x":710,"y":85,"trait":"vertexDefault"},{"x":712.5,"y":85,"trait":"vertexDefault"},{"x":715,"y":85,"trait":"vertexDefault"},{"x":717.5,"y":85,"trait":"vertexDefault"},{"x":720,"y":85,"trait":"vertexDefault"},{"x":722.5,"y":85,"trait":"vertexDefault"},{"x":725,"y":85,"trait":"vertexDefault"},{"x":727.5,"y":85,"trait":"vertexDefault"},{"x":730,"y":85,"trait":"vertexDefault"},{"x":732.5,"y":85,"trait":"vertexDefault"},{"x":735,"y":85,"trait":"vertexDefault"},{"x":702.5,"y":-85,"trait":"vertexDefault"},{"x":705,"y":-85,"trait":"vertexDefault"},{"x":707.5,"y":-85,"trait":"vertexDefault"},{"x":710,"y":-85,"trait":"vertexDefault"},{"x":712.5,"y":-85,"trait":"vertexDefault"},{"x":715,"y":-85,"trait":"vertexDefault"},{"x":717.5,"y":-85,"trait":"vertexDefault"},{"x":720,"y":-85,"trait":"vertexDefault"},{"x":722.5,"y":-85,"trait":"vertexDefault"},{"x":725,"y":-85,"trait":"vertexDefault"},{"x":727.5,"y":-85,"trait":"vertexDefault"},{"x":730,"y":-85,"trait":"vertexDefault"},{"x":732.5,"y":-85,"trait":"vertexDefault"},{"x":735,"y":-85,"trait":"vertexDefault"},{"x":-700,"y":-321.4,"trait":"vertexDefault"},{"x":700,"y":-321.4,"trait":"vertexDefault"},{"x":700,"y":321.4,"trait":"vertexDefault"},{"x":-700,"y":321.4,"trait":"vertexDefault"},{"x":-630,"y":-126.4,"trait":"vertexDefault"},{"x":-630,"y":126.4,"trait":"vertexDefault"},{"x":630,"y":-126.4,"trait":"vertexDefault"},{"x":630,"y":126.4,"trait":"vertexDefault"},{"x":735,"y":-86.4,"trait":"vertexDefault"},{"x":735,"y":86.4,"trait":"vertexDefault"},{"x":-735,"y":-86.4,"trait":"vertexDefault"},{"x":-735,"y":86.4,"trait":"vertexDefault"}],"segments":[{"v0":0,"v1":1,"trait":"wall_map"},{"v0":99,"v1":12,"trait":"wall_map"},{"v0":13,"v1":100,"trait":"wall_map"},{"v0":2,"v1":3,"trait":"wall_map"},{"v0":101,"v1":8,"trait":"wall_map"},{"v0":5,"v1":6,"trait":"wall_map_nc"},{"v0":4,"v1":7,"trait":"wall_map_nc"},{"v0":11,"v1":98,"trait":"wall_map"},{"v0":6,"v1":15,"trait":"KO_barrier"},{"v0":7,"v1":14,"trait":"KO_barrier"},{"v0":6,"v1":7,"curve":180,"trait":"KO_wall_red"},{"v0":7,"v1":6,"curve":180,"trait":"KO_wall_blue"},{"v0":21,"v1":20,"trait":"decoration_map"},{"v0":23,"v1":22,"trait":"decoration_map"},{"v0":24,"v1":25,"curve":180,"trait":"decoration_map"},{"v0":25,"v1":24,"curve":180,"trait":"decoration_map"},{"v0":27,"v1":28,"trait":"decoration_map"},{"v0":29,"v1":26,"trait":"decoration_map"},{"v0":31,"v1":30,"curve":90,"trait":"decoration_map"},{"v0":32,"v1":33,"curve":90,"trait":"decoration_map"},{"v0":34,"v1":35,"trait":"decoration_map"},{"v0":37,"v1":36,"trait":"decoration_map"},{"v0":39,"v1":38,"trait":"map_point"},{"v0":38,"v1":39,"trait":"map_point"},{"v0":41,"v1":40,"trait":"map_point"},{"v0":40,"v1":41,"trait":"map_point"},{"v0":12,"v1":16,"trait":"wall_blue_goal"},{"v0":106,"v1":107,"trait":"wall_blue_goal"},{"v0":17,"v1":13,"trait":"wall_blue_goal"},{"v0":8,"v1":19,"trait":"wall_red_goal"},{"v0":109,"v1":108,"trait":"wall_red_goal"},{"v0":18,"v1":11,"trait":"wall_red_goal"},{"v0":11,"v1":8,"trait":"goal_line"},{"v0":12,"v1":13,"trait":"goal_line"},{"v0":102,"v1":103,"trait":"decoration_map"},{"v0":105,"v1":104,"trait":"decoration_map"}],"planes":[{"normal":[0,1],"dist":-350,"bCoef":0},{"normal":[0,-1],"dist":-350,"bCoef":0},{"normal":[1,0],"dist":-800,"bCoef":0},{"normal":[-1,0],"dist":-800,"bCoef":0},{"normal":[-1,0],"dist":-360,"bCoef":0,"cMask":["c1"]},{"normal":[1,0],"dist":-360,"bCoef":0,"cMask":["c0"]}],"goals":[{"p0":[-707.8,85],"p1":[-707.8,-85],"team":"red"},{"p0":[707.8,85],"p1":[707.8,-85],"team":"blue"}],"discs":[{"pos":[-700,-85],"trait":"goal_post"},{"pos":[-700,85],"trait":"goal_post"},{"pos":[700,-85],"trait":"goal_post"},{"pos":[700,85],"trait":"goal_post"}],"playerPhysics":{"bCoef":0,"acceleration":0.11,"kickingAcceleration":0.083,"kickStrength":4.545},"ballPhysics":{"radius":5.8,"bCoef":0.412,"invMass":1.5,"color":"FFF26D"},"spawnDistance":200,"traits":{"vertexDefault":{"bCoef":1,"cMask":[],"cGroup":[]},"wall_map":{"vis":true,"color":"151a1e","bCoef":1,"cMask":["ball"],"bias":-10},"wall_map_nc":{"vis":true,"color":"151a1e","bCoef":0,"cMask":[],"cGroup":[]},"decoration_map":{"vis":true,"color":"626262","bCoef":0,"cMask":[]},"goal_line":{"vis":true,"color":"c5c5c5","bCoef":0,"cMask":[]},"wall_red_goal":{"vis":true,"color":"ff6666","bCoef":0.1,"cMask":["ball"],"bias":-10},"wall_blue_goal":{"vis":true,"color":"6666ff","bCoef":0.1,"cMask":["ball"],"bias":-10},"goal_post":{"radius":5.4,"invMass":0,"color":"031726"},"map_point":{"curve":180,"vis":true,"color":"626262","cMask":[]},"KO_barrier":{"vis":false,"bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO","blueKO"]},"KO_wall_red":{"vis":true,"color":"ce8a4a","bCoef":0.1,"cMask":["red","blue"],"cGroup":["redKO"]},"KO_wall_blue":{"vis":true,"color":"ce8a4a","bCoef":0.1,"cMask":["red","blue"],"cGroup":["blueKO"]}},"joints":[],"redSpawnPoints":[],"blueSpawnPoints":[]}`
);

var stadium_copy = JSON.parse(JSON.stringify(stadium));
var cameraFollowMode = 0;
var cameraFollow = { x: 0, y: 0 };
var currentFrame = -1;
var playerRadius = 15;

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
    g.team = g.team === 'red' ? haxball.Team.RED : haxball.Team.BLUE;
});

stadium = JSON.parse(JSON.stringify(stadium_copy));

var game = new Game();
game.init();

load_tile('grass');
load_tile('hockey');

var scorableDiscsId = (function () {
    var a = [];
    for (var b = 0; b < 256; b++) a.push(0);
    return a;
})();

var scorableDiscsPos = (function () {
    var a = [];
    for (var b = 0; b < 256; b++) a.push([0, 0]);
    return a;
})();

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

var myEl = document.getElementById('load_last');
myEl.addEventListener('click', watchLastGame, false);

var input = document.getElementById('input');
input.addEventListener('change', handleFile, false);
var fileread = new FileReader();
fileread.addEventListener('loadend', loadFileRec, false);

var recCheck =
    (localStorage.getItem('rec') === '1' &&
        localStorage.getItem('last') != null) ||
    (localStorage.getItem('rec') === '2' &&
        localStorage.getItem('file') != null);
var playersArray = [];
var arrayRec = [];
var kickArray = [];
var triggerDistance = 15 + 10 + 0.01;

if (!recCheck) {
    var a = new Player();
    a.init(
        'Gouiri',
        '10',
        haxball.Team.RED,
        [['ArrowUp'], ['ArrowLeft'], ['ArrowDown'], ['ArrowRight'], ['KeyX']],
        null
    );
    setPlayerDefaultProperties(a);
    playersArray.push(a);
    // var b = new Player();
    // b.init(
    //     'Bot',
    //     '1',
    //     haxball.Team.RED,
    //     [],
    //     alwaysRight
    // );
    // setPlayerDefaultProperties(b);
    // playersArray.push(b);
    arrayRec = playersArray.map((p) => [[p.name, p.avatar, p.team.id], []]);
} else {
    if (localStorage.getItem('rec') == '1') {
        arrayRec = JSON.parse(localStorage.getItem('last'));
        game.kickoffReset = arrayRec[0];
        arrayRec.shift();
        arrayRec = arrayRec[0];
    }
    else if (localStorage.getItem('rec') == '2') {
        arrayRec = JSON.parse(localStorage.getItem('file'));
        game.kickoffReset = arrayRec[0];
        arrayRec.shift();
        arrayRec = arrayRec[0];
    }
    let spec = new Player();
    spec.init('spec', '1', haxball.Team.SPECTATORS);
    setPlayerDefaultProperties(spec);
    playersArray.push(spec);
    for (let i = 0; i < arrayRec.length; i++) {
        let a = new Player();
        a.init(
            arrayRec[i][0][0],
            arrayRec[i][0][1],
            getTeamByID(arrayRec[i][0][2]),
            null,
            playInputs
        );
        setPlayerDefaultProperties(a);
        playersArray.push(a);
    }
}

localStorage.setItem('rec', '0');

var inputArrayCurr = playersArray.map((p) => [
    [p.name, p.avatar, p.team.id],
    [],
]);

resetPositionDiscs();

function BallKick(
    player,
    time,
    position,
    speed,
    playerDiscs,
    coneArray,
    types
) {
    this.player = player;
    this.time = time;
    this.position = position;
    this.speed = speed;
    this.playerDiscs = playerDiscs;
    this.coneArray = coneArray;
    this.types = types;
}

function ConeElement(
    position,
    speed,
    pointL,
    vecL,
    pointR,
    vecR,
    pointU,
    frameStart,
    frameEnd,
    playersRange
) {
    this.position = position;
    this.speed = speed;
    this.pointL = pointL;
    this.vecL = vecL;
    this.pointR = pointR;
    this.vecR = vecR;
    this.pointU = pointU;
    this.frameStart = frameStart;
    this.frameEnd = frameEnd;
    this.playersRange = playersRange;
}

function getTeamByID(id) {
    return id == 0
        ? haxball.Team.SPECTATORS
        : id == 1
        ? haxball.Team.RED
        : haxball.Team.BLUE;
}

function downloadFile(file, fileName) {
    var c = window.document.createElement('a');
    c.style.display = 'display: none';
    window.document.body.appendChild(c);
    var d = URL.createObjectURL(file);
    c.href = d;
    c.download = fileName;
    c.click();
    URL.revokeObjectURL(d);
    c.remove();
}

function downloadRec(rec, fileName) {
    downloadFile(
        new Blob([rec], {
            type: 'octet/stream',
        }),
        fileName
    );
}

function saveRecording(rec) {
    var d = new Date();
    downloadRec(
        rec,
        `HBReplay-${d.getFullYear()}-${
            d.getMonth() + 1
        }-${d.getDate()}-${d.getHours()}h${d.getMinutes()}m.hbar`
    );
}

function watchLastGame() {
    if (localStorage.getItem('last') != null) {
        localStorage.setItem('rec', '1');
        document.location.reload(true);
    }
}

function handleFile() {
    var file = input.files[0];
    fileread.readAsArrayBuffer(file);
}

function loadFileRec() {
    var replay = msgpack.deserialize(new Uint8Array(fileread.result));
    localStorage.setItem('file', JSON.stringify(replay));
    localStorage.setItem('rec', '2');
    document.location.reload(true);
}

function createNickCanvas() {
    // canvas for nickname
    var a = window.document.createElement('canvas');
    a.width = 160;
    a.height = 34;
    nicknameCanvasCtx = a.getContext('2d', null);
}

function createAvatarCanvas() {
    // canvas for avatar
    var a = window.document.createElement('canvas');
    a.width = 64;
    a.height = 64;
    return (avatarCanvasCtx = a.getContext('2d', null));
}

function checkKick(player) {
    if (player.shotReset) return !player.shooting;
    return player.shooting;
}

function getRGBA(a) {
    return (
        'rgba(' +
        [(a & 16711680) >>> 16, (a & 65280) >>> 8, a & 255].join() +
        ',255)'
    );
}

function getInputs(a, b, c, d, e) {
    return a + b * 2 + c * 4 + d * 8 + e * 16;
}

function getDecimalFromRGB(a) {
    var b = a.substring(4, a.length - 1).split(',');
    return (parseInt(b[0]) << 16) + (parseInt(b[1]) << 8) + parseInt(b[2]);
}

function getAvatarPattern(ctx, avatar, colors) {
    if (colors.length > 0) {
        ctx.save();
        ctx.translate(32, 32);
        ctx.rotate((3.141592653589793 * 32) / 128);
        for (
            var c = -32, d = 64 / colors.length, e = 0;
            e < colors.length;
            e++
        ) {
            ctx.fillStyle = getRGBA(colors[e]);
            ctx.fillRect(c, -32, d + 4, 64);
            c += d;
        }
        ctx.restore();
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.font = "900 34px 'Arial Black','Arial Bold',Gadget,sans-serif";
        ctx.fillText(avatar.substring(0, 2), 32, 44);
        var avatarPattern = ctx.createPattern(ctx.canvas, 'no-repeat');
        return avatarPattern;
    }
}

function drawPlayerDisc(player) {
    // draws (player) discs
    if (player.disc !== null) {
        ctx.beginPath();
        ctx.fillStyle = player.avatarPattern;
        ctx.strokeStyle = checkKick(player) ? 'white' : 'black';
        ctx.beginPath();
        ctx.arc(
            player.disc.x,
            player.disc.y,
            player.disc.radius,
            0,
            2 * Math.PI,
            false
        );
        ctx.save();
        var c = player.disc.radius / 32;
        ctx.translate(player.disc.x, player.disc.y);
        ctx.scale(c, c);
        ctx.translate(-32, -32);
        ctx.fill();
        ctx.restore();
        ctx.stroke();
    }
}

function drawPlayerDiscExtLine(player) {
    if (player.disc !== null) {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = 0.3;
        ctx.arc(
            player.disc.x,
            player.disc.y,
            player.disc.radius + 10,
            0,
            2 * Math.PI,
            false
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawTextNickCanvas(ctx, nickname) {
    // draw text in nickname canvas
    ctx.resetTransform();
    ctx.clearRect(0, 0, 160, 34);
    ctx.font = '26px sans-serif';
    ctx.fillStyle = 'white';
    if (ctx.measureText(nickname).width > 160) {
        ctx.textAlign = 'left';
        ctx.translate(2, 29);
    } else {
        ctx.textAlign = 'center';
        ctx.translate(80, 29);
    }
    ctx.fillText(nickname, 0, 0);
    return ctx;
}

function insertNickCanvasGlobalCanvas(globalCtx, nickCtx, x, y) {
    // draw nickname canvas in global canvas
    globalCtx.drawImage(nickCtx.canvas, 0, 0, 160, 34, x - 40, y - 34, 80, 17);
}

function setDiscDefaultProperties(currentDisc, defaultDisc) {
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
    if (stadium.playerPhysics !== undefined) {
        var pPhys = stadium.playerPhysics;
    } else {
        var pPhys = haxball.playerPhysics;
    }
    if (player.team == haxball.Team.SPECTATORS) player.disc = null;
    else {
        player.inputs = 0;
        var pDisc = player.disc;
        if (pDisc == null) {
            pDisc = new Disc();
            pDisc.playerPhysics();
            player.disc = pDisc;
            discs.push(pDisc);
        }
        var defPDisc = collisionTransformation(haxball.playerPhysics);
        pDisc.radius = defPDisc.radius;
        if (pPhys.radius != null) pDisc.radius = pPhys.radius;
        pDisc.invMass = defPDisc.invMass;
        if (pPhys.invMass != null) pDisc.invMass = pPhys.invMass;
        pDisc.damping = defPDisc.damping;
        if (pPhys.damping != null) pDisc.damping = pPhys.damping;
        pDisc.bCoef = defPDisc.bCoef;
        if (pPhys.bCoef != null) pDisc.bCoef = pPhys.bCoef;
        if (pPhys.acceleration != null) pDisc.acceleration = pPhys.acceleration;
        if (pPhys.kickingDamping != null)
            pDisc.kickingDamping = pPhys.kickingDamping;
        if (pPhys.kickingAcceleration != null)
            pDisc.kickingAcceleration = pPhys.kickingAcceleration;
        pDisc.cMask =
            39 +
            (player.team == haxball.Team.RED
                ? haxball.collisionFlags.redKO
                : haxball.collisionFlags.blueKO);
        pDisc.cGroup = player.team.cGroup | defPDisc.cGroup;
        pDisc.x = (2 * player.team.id - 3) * stadium.width;
        pDisc.y = 0;
        pDisc.xspeed = 0;
        pDisc.yspeed = 0;
    }
}

function setCameraFollow(playerPos, widthCanvas, heightCanvas, refresh) {
    var centerX, centerY;
    if (playerPos != null && cameraFollowMode == 1) {
        // player follow
        centerX = playerPos.x;
        centerY = playerPos.y;
    } else {
        // ball follow
        centerX = discs[0].x;
        centerY = discs[0].y;
        if (playerPos != null) {
            centerX = 0.5 * (centerX + playerPos.x);
            centerY = 0.5 * (centerY + playerPos.y);
            var midX = 0.5 * widthCanvas,
                midY = 0.5 * heightCanvas;
            var infX = playerPos.x - midX + 50,
                infY = playerPos.y - midY + 50,
                supX = playerPos.x + midX - 50,
                supY = playerPos.y + midY - 50;
            centerX = centerX > supX ? supX : centerX < infX ? infX : centerX;
            centerY = centerY > supY ? supY : centerY < infY ? infY : centerY;
        }
    }
    frames = 60 * refresh;
    if (frames > 1) frames = 1;
    smoothingRatio = 0.04;
    frames *= smoothingRatio;
    cameraFollow.x += (centerX - cameraFollow.x) * frames;
    cameraFollow.y += (centerY - cameraFollow.y) * frames;
    checkCameraLimits(widthCanvas, heightCanvas, stadium); // stay within stadium limits
}

function checkCameraLimits(widthCanvas, heightCanvas, stadium) {
    if (widthCanvas > 2 * stadium.width) {
        cameraFollow.x = 0;
    }
    else if (cameraFollow.x + 0.5 * widthCanvas > stadium.width) {
        cameraFollow.x = stadium.width - 0.5 * widthCanvas;
    }
    else if (cameraFollow.x - 0.5 * widthCanvas < -stadium.width) {
        cameraFollow.x = -stadium.width + 0.5 * widthCanvas;
    }

    if (heightCanvas > 2 * stadium.height) {
        cameraFollow.y = 0;
    }
    else if (cameraFollow.y + 0.5 * heightCanvas > stadium.height) {
        cameraFollow.y = stadium.height - 0.5 * heightCanvas;
    }
    else if (cameraFollow.y - 0.5 * heightCanvas < -stadium.height) {
        cameraFollow.y = -stadium.height + 0.5 * heightCanvas;
    }
}

function resetPositionDiscs() {
    game.state = 0;
    setDiscDefaultProperties(discs[0], stadium.discs[0]); // TODO : full kickoffReset
    var teamArray = [0, 0, 0];
    for (var i = 0; i < playersArray.length; i++) {
        player = playersArray[i];
        setPlayerDefaultProperties(player);
        teamP = player.team;
        if (teamP !== haxball.Team.SPECTATORS) {
            // TODO : teamSpawnPoints
            var f = player.disc;
            var valueArr = teamArray[teamP.id];
            var lambda = (valueArr + 1) >> 1;
            if (valueArr % 2 == 1) lambda = -lambda;
            pos_x = stadium.spawnDistance * (2 * teamP.id - 3); // +- spawnDistance
            pos_y = 55 * lambda;
            f.x = pos_x;
            f.y = pos_y;
            teamArray[teamP.id]++;
        }
    }
}

function keyDownHandler(e) {
    playersArray.forEach((p) => {
        p.controls.forEach((c, i) => {
            if (c.find((x) => x == e.code)) {
                if ((p.inputs & (2 ** i)) == 0) p.inputs += 2 ** i;
            }
        });
    });
    if (e.code.substring(0, e.code.length - 1) == 'Digit') {
        var nb = parseInt(e.code[e.code.length - 1]);
        if (nb > 0 && nb <= zoom_levels.length) {
            zoom = zoom_levels[nb - 1];
        }
    }
}

function keyUpHandler(e) {
    playersArray.forEach((p) => {
        p.controls.forEach((c, i) => {
            if (c.find((x) => x == e.code)) {
                if ((p.inputs & (2 ** i)) != 0) p.inputs -= 2 ** i;
            }
        });
    });
}

function collisionTransformation(physics, vertexes = null) {
    var cMask = physics.cMask;
    var y = 0;
    if (typeof cMask === 'object') {
        cMask.forEach((x) => {
            y |= haxball.collisionFlags[x];
        });
    }
    physics.cMask = y;
    var cGroup = physics.cGroup;
    y = 0;
    if (typeof cGroup === 'object') {
        cGroup.forEach((x) => {
            y |= haxball.collisionFlags[x];
        });
    }
    physics.cGroup = y;
    if (y == 1) physics.cGroup = 193;
    if (physics.pos !== undefined) {
        if (physics.x === undefined) {
            physics.x = physics.pos[0];
            physics.y = physics.pos[1];
        }
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
    var curve = segment.curve * 0.017453292519943295;
    if (curve < 0) {
        curve *= -1;
        segment.curve *= 1;
        var b = segment.v0;
        segment.v0 = segment.v1;
        segment.v1 = b;
        if (segment.bias !== undefined) segment.bias = -segment.bias;
    }
    var liminf = 0.17435839227423353;
    var limsup = 5.934119456780721;
    if (curve > liminf && curve < limsup) {
        segment.curveF = 1 / Math.tan(curve / 2);
    }
}

function getStuffSegment(segment) {
    if (segment.curveF !== undefined) {
        // curveF
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
    } else {
        a = { x: segment.v0[0], y: segment.v0[1] };
        b = { x: segment.v1[0], y: segment.v1[1] };
        c = a.x - b.x;
        a = -(a.y - b.y);
        b = Math.sqrt(a * a + c * c);
        segment.normal = [a / b, c / b];
    }
}

function load_tile(name) {
    var tile = new Image(128, 128);
    tile.onload = function () {
        var ctx = canvas.getContext('2d');
        bg_patterns[name] = ctx.createPattern(tile, null);
        render(stadium);
    };
    tile.src = 'img/' + name + 'tile.png';
}

function resolvePlayerMovement(player) {
    if (player.disc != null) {
        var playerDisc = player.disc;
        if ((player.inputs & Input.SHOOT) != 0) {
            player.shooting = true;
        } else {
            player.shooting = false;
            player.shotReset = false;
        }
        if (checkKick(player)) {
            let check = false;
            discs.forEach((d) => {
                if (
                    (d.cGroup & haxball.collisionFlags.kick) !== 0 &&
                    d != playerDisc
                ) {
                    var discPos = { x: d.x, y: d.y };
                    var playerPos = { x: playerDisc.x, y: playerDisc.y };
                    var physics = haxball.playerPhysics;
                    var dist_x = discPos.x - playerPos.x;
                    var dist_y = discPos.y - playerPos.y;
                    var dist = Math.sqrt(dist_x ** 2 + dist_y ** 2);
                    if (dist - playerDisc.radius - d.radius < 4) {
                        dist_x = dist_x / dist;
                        dist_y = dist_y / dist;
                        var kStr = physics.kickStrength;
                        d.xspeed = d.xspeed + dist_x * kStr;
                        d.yspeed = d.yspeed + dist_y * kStr;

                        // TODO : add kickback
                        var playerDiscs = playersArray
                            .map((p) => p.disc)
                            .filter((d) => d != null);
                        kickArray.push(
                            new BallKick(
                                player,
                                game.time,
                                discPos,
                                { x: d.xspeed, y: d.yspeed },
                                playerDiscs,
                                [],
                                []
                            )
                        );
                        calculateConeAndType(discs, player);
                        check = true;
                    }
                }
            });
            if (check) {
                player.shotReset = true;
                if (playerDisc.cMask !== 39) playerDisc.cMask = 39;
                var kickSound = new Audio('audio/kick.mp3');
                kickSound.play();
            }
        }
        var direction = [0, 0];
        if ((player.inputs & Input.UP) != 0) direction[1]--;
        if ((player.inputs & Input.LEFT) != 0) direction[0]--;
        if ((player.inputs & Input.DOWN) != 0) direction[1]++;
        if ((player.inputs & Input.RIGHT) != 0) direction[0]++;

        direction = normalise(direction);

        playerDisc.xspeed =
            playerDisc.xspeed +
            direction[0] *
                (checkKick(player)
                    ? playerDisc.kickingAcceleration
                    : playerDisc.acceleration);
        playerDisc.yspeed =
            playerDisc.yspeed +
            direction[1] *
                (checkKick(player)
                    ? playerDisc.kickingAcceleration
                    : playerDisc.acceleration);
    }
}

function resolveDVCollision(disc, vertex) {
    var discPos = { x: disc.x, y: disc.y };
    var vertexPos = { x: vertex.x, y: vertex.y };
    var dist_x = discPos.x - vertexPos.x;
    var dist_y = discPos.y - vertexPos.y;
    var dist = dist_x * dist_x + dist_y * dist_y;
    if (dist > 0 && dist <= disc.radius ** 2) {
        dist = Math.sqrt(dist);
        dist_x = dist_x / dist;
        dist_y = dist_y / dist;
        var lambda = disc.radius - dist;
        disc.x = disc.x + dist_x * lambda;
        disc.y = disc.y + dist_y * lambda;
        var discSpeed = { x: disc.xspeed, y: disc.yspeed };
        var speedCoef = dist_x * discSpeed.x + dist_y * discSpeed.y;
        if (speedCoef < 0) {
            speedCoef *= disc.bCoef * vertex.bCoef + 1;
            disc.xspeed = disc.xspeed - dist_x * speedCoef;
            disc.yspeed = disc.yspeed - dist_y * speedCoef;
        }
    }
}

function resolveDSCollision(disc, segment) {
    var distance;
    var coef_x;
    var coef_y;
    if (segment.curveF === undefined) {
        var v0Pos = { x: segment.v0[0], y: segment.v0[1] };
        var v1Pos = { x: segment.v1[0], y: segment.v1[1] };
        var seg_x = v1Pos.x - v0Pos.x;
        var seg_y = v1Pos.y - v0Pos.y;
        var discPos = { x: disc.x, y: disc.y };
        var dist0_x = discPos.x - v0Pos.x;
        var dist0_y = discPos.y - v0Pos.y;
        var dist1_x = discPos.x - v1Pos.x;
        var dist1_y = discPos.y - v1Pos.y;
        g = { x: disc.x, y: disc.y };
        if (
            dist0_x * seg_x + dist0_y * seg_y > 0 && dist1_x * seg_x + dist1_y * seg_y < 0
        ) {
            var norm = normalise([
                segment.v0[1] - segment.v1[1],
                segment.v1[0] - segment.v0[0],
            ]);
            norm = { x: -norm[0], y: -norm[1] };
            coef_x = norm.x;
            coef_y = norm.y;
            distance = coef_x * dist1_x + coef_y * dist1_y;
        }
    } else {
        var circleC = segment.circleCenter;
        var discPos = { x: disc.x, y: disc.y };
        var dist_x = discPos.x - circleC[0];
        var dist_y = discPos.y - circleC[1];
        var tan1 = segment.v1Tan;
        var tan0 = segment.v0Tan;
        if (
            (tan1[0] * dist_x + tan1[1] * dist_y > 0 && tan0[0] * dist_x + tan0[1] * dist_y > 0) == segment.curveF < 0
        )
            return;
        var dist = Math.sqrt(dist_x * dist_x + dist_y * dist_y);
        if (dist == 0) return;
        distance = dist - segment.circleRadius;
        coef_x = dist_x / dist;
        coef_y = dist_y / dist;
    }
    var bias = segment.bias;
    if (bias == 0 || bias == undefined) {
        if (distance < 0) {
            distance = -distance;
            coef_x = -coef_x;
            coef_y = -coef_y;
        }
    } else if (bias < 0) {
        bias = -bias;
        distance = -distance;
        coef_x = -coef_x;
        coef_y = -coef_y;
        if (distance < -bias) return;
    }
    if (distance < disc.radius) {
        distance = disc.radius - distance;
        disc.x = disc.x + coef_x * distance;
        disc.y = disc.y + coef_y * distance;
        var discSpeed = { x: disc.xspeed, y: disc.yspeed };
        var speedCoef = coef_x * discSpeed.x + coef_y * discSpeed.y;
        if (speedCoef < 0) {
            speedCoef *= disc.bCoef * segment.bCoef + 1;
            disc.xspeed = disc.xspeed - coef_x * speedCoef;
            disc.yspeed = disc.yspeed - coef_y * speedCoef;
        }
    }
}

function resolveDPCollision(disc, plane) {
    var norm = normalise(plane.normal);
    norm = { x: norm[0], y: norm[1] };
    var discPos = { x: disc.x, y: disc.y };
    var dist = plane.dist - (norm.x * discPos.x + norm.y * discPos.y) + disc.radius;
    if (dist > 0) {
        disc.x = disc.x + norm.x * dist;
        disc.y = disc.y + norm.y * dist;
        var discSpeed = { x: disc.xspeed, y: disc.yspeed };
        var speedCoef = norm.x * discSpeed.x + norm.y * discSpeed.y;
        if (speedCoef < 0) {
            speedCoef *= disc.bCoef * plane.bCoef + 1;
            disc.xspeed = disc.xspeed - norm.x * speedCoef;
            disc.yspeed = disc.yspeed - norm.y * speedCoef;
        }
    }
}

function resolveDDCollision(discA, discB) {
    var dist = Math.sqrt(Math.pow(discA.x - discB.x, 2) + Math.pow(discA.y - discB.y, 2));
    var radiusSum = discA.radius + discB.radius;
    if (dist > 0 && dist <= radiusSum) {
        var normal = [(discA.x - discB.x) / dist, (discA.y - discB.y) / dist];
        var massFactor = discA.invMass / (discA.invMass + discB.invMass);

        discA.x += normal[0] * (radiusSum - dist) * massFactor;
        discA.y += normal[1] * (radiusSum - dist) * massFactor;
        discB.x -= normal[0] * (radiusSum - dist) * (1 - massFactor);
        discB.y -= normal[1] * (radiusSum - dist) * (1 - massFactor);
        
        var relativeVelocity = [discA.xspeed - discB.xspeed, discA.yspeed - discB.yspeed];
        var normalVelocity = relativeVelocity[0] * normal[0] + relativeVelocity[1] * normal[1];

        if (normalVelocity < 0) {
            speedFactor = normalVelocity * (discA.bCoef * discB.bCoef + 1);
            
            discA.xspeed = discA.xspeed - normal[0] * speedFactor * massFactor;
            discA.yspeed = discA.yspeed - normal[1] * speedFactor * massFactor;
            discB.xspeed = discB.xspeed + normal[0] * speedFactor * (1 - massFactor);
            discB.yspeed = discB.yspeed + normal[1] * speedFactor * (1 - massFactor);
        }
    }
}

function checkGoal(discPos, discPosPrev) {
    // discPos : current position of scorable disc, discPosPrev : position just before
    if (stadium.goals == undefined) return haxball.Team.SPECTATORS;
    for (var i = 0; i < stadium.goals.length; i++) {
        var check;
        var goal = stadium.goals[i];
        var point0 = goal.p0;
        var point1 = goal.p1;
        var dist_x = discPosPrev[0] - discPos[0];
        var dist_y = discPosPrev[1] - discPos[1];
        if (
            (-(point0[1] - discPos[1]) * dist_x + (point0[0] - discPos[0]) * dist_y) *
            (-(point1[1] - discPos[1]) * dist_x + (point1[0] - discPos[0]) * dist_y) > 0
        ) {
            check = false;
        } else {
            var goal_x = point1[0] - point0[0];
            var goal_y = point1[1] - point0[1];
            if (
                (-(discPos[1] - point0[1]) * goal_x +
                    (discPos[0] - point0[0]) * goal_y) *
                    (-(discPosPrev[1] - point0[1]) * goal_x +
                        (discPosPrev[0] - point0[0]) * goal_y) >
                0
            ) {
                check = false;
            } else {
                check = true;
            }
        }
        if (check) {
            goalSound.play();
            return goal.team;
        }
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
        c = (a / 60) | 0,
        spans = document.getElementsByClassName('digit');
    spans[3].textContent = '' + (b % 10);
    spans[2].textContent = '' + (((b / 10) | 0) % 10);
    spans[1].textContent = '' + (c % 10);
    spans[0].textContent = '' + (((c / 10) | 0) % 10);
    if (game.time > 60 * game.timeLimit - 30) {
        var span = document.getElementsByClassName('game-timer-view');
        span[0].className = 'game-timer-view time-warn';
    }
    if (game.time > 60 * game.timeLimit) {
        var span = document.getElementsByClassName('game-timer-view time-warn');
        span[0].className = 'game-timer-view';
        span = document.getElementsByClassName('overtime');
        span[0].className = 'overtime on';
    }
    if (game.timeout > 0) {
        var scores = document.getElementsByClassName('score');
        scores[1].textContent = '' + game.blue;
        scores[0].textContent = '' + game.red;
    }
}

function draw() {
    

        ctx.clearRect(
            -canvas.width / 2,
            -canvas.height / 2,
            canvas.width,
            canvas.height
        );

        currentFrame++;
        var scoreIndex = 0;

        for (var i = 0; i < discs.length; i++) {
            // get all scorable discs
            var disc = discs[i];
            if ((disc.cGroup & 128) != 0) {
                scorableDiscsId[scoreIndex] = i;
                scorableDiscsPos[scoreIndex][0] = disc.x;
                scorableDiscsPos[scoreIndex][1] = disc.y;
                scoreIndex++;
            }
        }

        playersArray
            .filter((p) => p.team.id !== 0)
            .forEach((p, i) => {
                if (p.bot) p.bot(p, { inputArray: arrayRec[i][1] });
                resolvePlayerMovement(p);
                inputArrayCurr[i][1][currentFrame] = p.inputs;
            });

        discs.forEach((d) => {
            d.x += d.xspeed;
            d.y += d.yspeed;
            d.xspeed *= d.damping;
            d.yspeed *= d.damping;
        });

        discs.forEach((d_a, i_a) => {
            // collisions
            discs
                .filter((_, i) => i > i_a)
                .forEach((d_b) => {
                    if (
                        (d_a.cGroup & d_b.cMask) !== 0 &&
                        (d_a.cMask & d_b.cGroup) !== 0
                    ) {
                        resolveDDCollision(d_a, d_b);
                    }
                });
            if (d_a.invMass !== 0) {
                planes.forEach((p) => {
                    if (
                        (d_a.cGroup & p.cMask) !== 0 &&
                        (d_a.cMask & p.cGroup) !== 0
                    ) {
                        resolveDPCollision(d_a, p);
                    }
                });
                segments.forEach((s) => {
                    if (
                        (d_a.cGroup & s.cMask) !== 0 &&
                        (d_a.cMask & s.cGroup) !== 0
                    ) {
                        resolveDSCollision(d_a, s);
                    }
                });
                vertexes.forEach((v) => {
                    if (
                        (d_a.cGroup & v.cMask) !== 0 &&
                        (d_a.cMask & v.cGroup) !== 0
                    ) {
                        resolveDVCollision(d_a, v);
                    }
                });
            }
        });

        if (game.state == 0) {
            // "kickOffReset"
            for (var i = 0; i < discs.length; i++) {
                var disc = discs[i];
                if (disc.x != null) disc.cMask = 39 | game.kickoffReset;
            }
            var ball = discs[0];
            if (ball.xspeed * ball.xspeed + ball.yspeed * ball.yspeed > 0)
                game.state = 1;
        } else if (game.state == 1) {
            // "gameOnGoing"
            game.time += 0.016666666666666666;
            for (var i = 0; i < discs.length; i++) {
                var disc = discs[i];
                if (disc.x != null) disc.cMask = 39;
            }
            var scoreTeam = haxball.Team.SPECTATORS;
            for (var i = 0; i < scoreIndex; i++) {
                scoreTeam = checkGoal(
                    [discs[scorableDiscsId[i]].x, discs[scorableDiscsId[i]].y],
                    scorableDiscsPos[i]
                );
                if (scoreTeam != haxball.Team.SPECTATORS) break;
            }
            if (scoreTeam != haxball.Team.SPECTATORS) {
                game.state = 2;
                game.timeout = 150;
                game.teamGoal = scoreTeam;
                scoreTeam.name == haxball.Team.BLUE.name ? game.red++ : game.blue++;
                if (
                    !((game.scoreLimit > 0 &&
                        (game.red >= game.scoreLimit ||
                            game.blue >= game.scoreLimit)) ||
                    (game.timeLimit > 0 &&
                        game.time >= 60 * game.timeLimit &&
                        game.red != game.blue))
                ) {
                    game.kickoffReset = scoreTeam.id * 8;
                }
            } else {
                if (
                    game.timeLimit > 0 &&
                    game.time >= 60 * game.timeLimit &&
                    game.red != game.blue
                ) {
                    endAnimation();
                }
            }
        } else if (game.state == 2) {
            // "goalScored"
            game.timeout--;
            if (game.timeout <= 0) {
                if (
                    (game.scoreLimit > 0 &&
                        (game.red >= game.scoreLimit ||
                            game.blue >= game.scoreLimit)) ||
                    (game.timeLimit > 0 &&
                        game.time >= 60 * game.timeLimit &&
                        game.red != game.blue)
                ) {
                    endAnimation();
                } else {
                    resetPositionDiscs();
                }
            }
        } else if (game.state == 3) {
            // "gameEnding"
            if (!reloadCheck) {
                if (!recCheck) {
                    inputArrayCurr = [game.kickoffReset, inputArrayCurr];
                    localStorage.setItem('last', JSON.stringify(inputArrayCurr));
                    recordingFinal = msgpack.serialize(inputArrayCurr)
                    saveRecording(recordingFinal);
                }
                document.location.reload(true);
                reloadCheck = true;
                setTimeout(() => {
                    reloadCheck = false;
                }, 1000);
            }
            game.timeout--;
            if (game.timeout <= 0 && game.start) {
                game.start = false;
                for (var i = 0; i < playersArray.length; i++) {
                    var player = playersArray[i];
                    player.disc = null;
                    player.spawnPoint = 0;
                }
            }
        }

        updateBar();
        resize_canvas();
}

function Shape(type, object, i) {
    return { type: type, object: object, index: i };
}

function color_to_style(color, def) {
    if (!color) {
        return def ? def : 'rgb(0,0,0)';
    } else if (color.substr) {
        return '#' + color;
    } else {
        return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    }
}

function norm(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function dist(a, b) {
    return norm([a[0] - b[0], a[1] - b[1]]);
}

function normalise(v) {
    var k = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    var x = v[0] / (k || 1);
    var y = v[1] / (k || 1);
    return [x, y];
}

function render(st) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(
        0,
        0,
        canvas_rect[2] - canvas_rect[0],
        canvas_rect[3] - canvas_rect[1]
    );
    setCameraFollow(
        playersArray[0].disc,
        canvas.width / zoom,
        canvas.height / zoom,
        1 / 60
    );
    ctx.translate(-canvas_rect[0], -canvas_rect[1]);
    ctx.scale(window.devicePixelRatio * zoom, window.devicePixelRatio * zoom);
    ctx.translate(-cameraFollow.x, -cameraFollow.y);

    renderbg(st, ctx);

    segments.forEach((segment) => {
        if (segment.vis) {
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = color_to_style(
                segment.color,
                haxball.segment_color
            );
            var segV0 = segment.v0;
            var segV1 = segment.v1;
            if (segment.curveF === undefined) {
                ctx.moveTo(segV0[0], segV0[1]);
                ctx.lineTo(segV1[0], segV1[1]);
            } else {
                var segCC = segment.circleCenter;
                var pos_x = segV0[0] - segCC[0];
                var pos_y = segV0[1] - segCC[1];
                ctx.arc(
                    segCC[0],
                    segCC[1],
                    Math.sqrt(pos_x * pos_x + pos_y * pos_y),
                    Math.atan2(pos_y, pos_x),
                    Math.atan2(segV1[1] - segCC[1], segV1[0] - segCC[0])
                );
            }
            ctx.stroke();
        }
    });

    drawPlayerDiscExtLine(playersArray[0]);

    discs.forEach((disc, i) => {
        if (i < discs.length - playersArray.filter((p) => p.team != haxball.Team.SPECTATORS).length) {
            ctx.beginPath();
            ctx.arc(disc.x, disc.y, disc.radius, 0, Math.PI * 2, true);
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 2;
            ctx.fillStyle = color_to_style(
                disc.color,
                haxball.discPhysics.color
            );
            ctx.fill();
            ctx.stroke();
        }
    });

    playersArray.forEach((p, i) => {
        drawPlayerDisc(p);
        // if (i !== 0 && p.disc !== null) insertNickCanvasGlobalCanvas(ctx, p.nicknameCanvasContext, p.disc.x, p.disc.y + 50);
    });

    // if (kickArray.length > 0) renderCones();
}

function renderCones() {
    var kick = kickArray[kickArray.length - 1];
    for (let i = 0; i < kick.coneArray.length; i++) {
        var cone = kick.coneArray[i];

        ctx.beginPath();
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = color_to_style(null, haxball.segment_color);
        ctx.moveTo(cone.pointL.x, cone.pointL.y);
        ctx.lineTo(cone.pointR.x, cone.pointR.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = color_to_style(null, haxball.segment_color);
        ctx.moveTo(cone.pointL.x, cone.pointL.y);
        var speed = Math.sqrt(cone.vecL.x ** 2 + cone.vecL.y ** 2);
        var posEnd = predictPositionBall(
            cone.pointL,
            cone.vecL,
            cone.frameEnd - cone.frameStart
        );
        posEnd.x +=
            ((triggerDistance + 4 + 2 * playerRadius) * cone.vecL.x) / speed;
        posEnd.y +=
            ((triggerDistance + 4 + 2 * playerRadius) * cone.vecL.y) / speed;

        ctx.lineTo(posEnd.x, posEnd.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = color_to_style(null, haxball.segment_color);
        ctx.moveTo(cone.pointR.x, cone.pointR.y);
        var speed = Math.sqrt(cone.vecR.x ** 2 + cone.vecR.y ** 2);
        var posEnd = predictPositionBall(
            cone.pointR,
            cone.vecR,
            cone.frameEnd - cone.frameStart
        );
        posEnd.x +=
            ((triggerDistance + 4 + 2 * playerRadius) * cone.vecR.x) / speed;
        posEnd.y +=
            ((triggerDistance + 4 + 2 * playerRadius) * cone.vecR.y) / speed;

        ctx.lineTo(posEnd.x, posEnd.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = 0.25;
        ctx.strokeStyle = color_to_style(null, haxball.segment_color);
        ctx.moveTo(cone.position.x, cone.position.y);
        var speed = Math.sqrt(cone.speed.x ** 2 + cone.speed.y ** 2);
        var posEnd = predictPositionBall(
            cone.position,
            cone.speed,
            cone.frameEnd - cone.frameStart
        );
        posEnd.x +=
            ((triggerDistance + 4 + 2 * playerRadius) * cone.speed.x) / speed;
        posEnd.y +=
            ((triggerDistance + 4 + 2 * playerRadius) * cone.speed.y) / speed;

        ctx.lineTo(posEnd.x, posEnd.y);
        ctx.stroke();
    }
}

function renderbg(stadium, ctx) {
    var bg = stadium.bg;
    ctx.save();

    if (bg.type == 'grass' || bg.type == 'hockey') {
        ctx.fillStyle = haxball[bg.type].bg_color;
        ctx.fillRect(-stadium.width, -stadium.height, 2 * stadium.width, 2 * stadium.height);

        ctx.beginPath();

        ctx.moveTo(-bg.width + bg.cornerRadius, -bg.height);
        // TODO: Left border is wrong
        ctx.arcTo(
            bg.width,
            -bg.height,
            bg.width,
            -bg.height + bg.cornerRadius,
            bg.cornerRadius
        );
        ctx.arcTo(
            bg.width,
            bg.height,
            bg.width - bg.cornerRadius,
            bg.height,
            bg.cornerRadius
        );
        ctx.arcTo(
            -bg.width,
            bg.height,
            -bg.width,
            bg.height - bg.cornerRadius,
            bg.cornerRadius
        );
        ctx.arcTo(
            -bg.width,
            -bg.height,
            -bg.width + bg.cornerRadius,
            -bg.height,
            bg.cornerRadius
        );

        ctx.save();
        ctx.clip();
        ctx.translate(40, 40);
        ctx.fillStyle = bg_patterns[bg.type];
        ctx.fillRect(
            -stadium.width - 50,
            -stadium.height - 50,
            2 * stadium.width - 40,
            2 * stadium.height - 20
        );
        ctx.restore();

        ctx.moveTo(0, -bg.height);
        ctx.lineTo(0, bg.height);
        ctx.moveTo(bg.kickOffRadius, 0);
        ctx.arc(0, 0, bg.kickOffRadius, 0, Math.PI * 2, true);

        ctx.lineWidth = 3;
        ctx.strokeStyle = haxball[bg.type].border_color;
        ctx.stroke();
    } else if (bg.type == '' && bg.color != undefined) {
        ctx.fillStyle = color_to_style(bg.color);
        ctx.fillRect(-stadium.width, -stadium.height, 2 * stadium.width, 2 * stadium.height);
        document.body.style.background = color_to_style(bg.color);
    } else {
        ctx.fillStyle = haxball.grass.bg_color;
        ctx.fillRect(-stadium.width, -stadium.height, 2 * stadium.width, 2 * stadium.height);
    }

    ctx.restore();
}

function for_all_shapes(st, types, f) {
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

function resize_canvas() {
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
        Math.round(Math.max(rect[3] + margin, canvas_div_size[1] / 2)),
    ];

    canvas_rect = rect;
    canvas.width = document.body.offsetWidth;
    canvas.height = document.body.offsetHeight;

    render(stadium);
}

function stepStat(stadiumDiscs, frameNumber) {
    var kick = kickArray[kickArray.length - 1];
    if (frameNumber == 0) {
        var coneObj = calculateCone(kick.position, kick.speed, 0);
        kick.coneArray.push(coneObj);
    }

    var scoreIndex = 0;
    for (var i = 0; i < discs.length; i++) {
        // get all scorable discs
        var disc = discs[i];
        if ((disc.cGroup & 128) != 0) {
            scorableDiscsId[scoreIndex] = i;
            scorableDiscsPos[scoreIndex][0] = disc.x;
            scorableDiscsPos[scoreIndex][1] = disc.y;
            scoreIndex++;
        }
    }

    var cone = kick.coneArray[kick.coneArray.length - 1];
    cone.pointU = {
        x: stadiumDiscs[0].x,
        y: stadiumDiscs[0].y,
    };
    cone.frameEnd = frameNumber;

    stadiumDiscs.forEach((d) => {
        d.x += d.xspeed;
        d.y += d.yspeed;
        d.xspeed *= d.damping;
        d.yspeed *= d.damping;
    });

    frameNumber++;

    stadiumDiscs = stadiumDiscs.filter(
        (d) =>
            ((d.cGroup & haxball.collisionFlags.red) == 0 &&
                (d.cGroup & haxball.collisionFlags.blue) == 0) ||
            d.cGroup == haxball.collisionFlags.all
    );
    var ballBefore = JSON.stringify(stadiumDiscs[0]);

    stadiumDiscs.forEach((d_a, i_a) => {
        stadiumDiscs
            .filter((_, i) => i > i_a)
            .forEach((d_b) => {
                if (
                    (d_a.cGroup & d_b.cMask) !== 0 &&
                    (d_a.cMask & d_b.cGroup) !== 0
                ) {
                    resolveDDCollision(d_a, d_b);
                }
            });
        if (d_a.invMass !== 0) {
            planes.forEach((p) => {
                if (
                    (d_a.cGroup & p.cMask) !== 0 &&
                    (d_a.cMask & p.cGroup) !== 0
                ) {
                    resolveDPCollision(d_a, p);
                }
            });
            segments.forEach((s) => {
                if (
                    (d_a.cGroup & s.cMask) !== 0 &&
                    (d_a.cMask & s.cGroup) !== 0
                ) {
                    resolveDSCollision(d_a, s);
                }
            });
            vertexes.forEach((v) => {
                if (
                    (d_a.cGroup & v.cMask) !== 0 &&
                    (d_a.cMask & v.cGroup) !== 0
                ) {
                    resolveDVCollision(d_a, v);
                }
            });
        }
    });

    var scoreTeam = haxball.Team.SPECTATORS;
    for (var i = 0; i < scoreIndex; i++) {
        scoreTeam = checkGoal(
            [discs[scorableDiscsId[i]].x, discs[scorableDiscsId[i]].y],
            scorableDiscsPos[i]
        );
        if (scoreTeam != haxball.Team.SPECTATORS) return;
    }

    if (!deepEqual(ballBefore, JSON.stringify(stadiumDiscs[0]))) {
        var coneObj = calculateCone(
            {
                x: stadiumDiscs[0].x,
                y: stadiumDiscs[0].y,
            },
            {
                x: stadiumDiscs[0].xspeed,
                y: stadiumDiscs[0].yspeed,
            },
            frameNumber
        );
        kick.coneArray.push(coneObj);
    }
}

function checkPointInCone(cone, point) {
    var speed = normObj(cone.speed);
    var pointRectangleL = predictPositionBall(
        cone.pointL,
        cone.speed,
        cone.frameEnd - cone.frameStart
    );
    pointRectangleL.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.speed.x) / speed;
    pointRectangleL.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.speed.y) / speed;

    var pointTriangleL = predictPositionBall(
        cone.pointL,
        cone.vecL,
        cone.frameEnd - cone.frameStart
    );
    pointTriangleL.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecL.x) / speed;
    pointTriangleL.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecL.y) / speed;

    var pointRectangleR = predictPositionBall(
        cone.pointR,
        cone.speed,
        cone.frameEnd - cone.frameStart
    );
    pointRectangleR.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.speed.x) / speed;
    pointRectangleR.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.speed.y) / speed;

    var pointTriangleR = predictPositionBall(
        cone.pointR,
        cone.vecR,
        cone.frameEnd - cone.frameStart
    );
    pointTriangleR.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecR.x) / speed;
    pointTriangleR.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecR.y) / speed;

    var rectangle = {
        x1: cone.pointL.x,
        y1: cone.pointL.y,
        x2: pointRectangleL.x,
        y2: pointRectangleL.y,
        x3: pointRectangleR.x,
        y3: pointRectangleR.y,
        x4: cone.pointR.x,
        y4: cone.pointR.y,
    };
    var triangleL = {
        x1: cone.pointL.x,
        y1: cone.pointL.y,
        x2: pointRectangleL.x,
        y2: pointRectangleL.y,
        x3: pointTriangleL.x,
        y3: pointTriangleL.y,
    };
    var triangleR = {
        x1: cone.pointR.x,
        y1: cone.pointR.y,
        x2: pointRectangleR.x,
        y2: pointRectangleR.y,
        x3: pointTriangleR.x,
        y3: pointTriangleR.y,
    };
    if (
        checkPointInRectangle(point, rectangle) ||
        checkPointInTriangle(point, triangleL) ||
        checkPointInTriangle(point, triangleR)
    )
        return true;
    return false;
}

function checkPointInRectangle(point, rectangle) {
    var triangle1 = {
        x1: rectangle.x1,
        y1: rectangle.y1,
        x2: rectangle.x2,
        y2: rectangle.y2,
        x3: rectangle.x3,
        y3: rectangle.y3,
    };
    var triangle2 = {
        x1: rectangle.x1,
        y1: rectangle.y1,
        x2: rectangle.x4,
        y2: rectangle.y4,
        x3: rectangle.x3,
        y3: rectangle.y3,
    };
    return (
        checkPointInTriangle(point, triangle1) ||
        checkPointInTriangle(point, triangle2)
    );
}

function checkPointInTriangle(point, triangle) {
    var denominator =
        (triangle.y2 - triangle.y3) * (triangle.x1 - triangle.x3) +
        (triangle.x3 - triangle.x2) * (triangle.y1 - triangle.y3);
    var a =
        ((triangle.y2 - triangle.y3) * (point.x - triangle.x3) +
            (triangle.x3 - triangle.x2) * (point.y - triangle.y3)) /
        denominator;
    var b =
        ((triangle.y3 - triangle.y1) * (point.x - triangle.x3) +
            (triangle.x1 - triangle.x3) * (point.y - triangle.y3)) /
        denominator;
    var c = 1 - a - b;
    return 0 <= a && a <= 1 && 0 <= b && b <= 1 && 0 <= c && c <= 1;
}

function checkSegmentInCone(cone, segL, segR) {
    var speed = normObj(cone.speed);
    var vecB = {
        x: -cone.speed.y,
        y: cone.speed.x,
    };

    var pointTriangleL = predictPositionBall(
        cone.pointL,
        cone.vecL,
        cone.frameEnd - cone.frameStart
    );
    pointTriangleL.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecL.x) / speed;
    pointTriangleL.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecL.y) / speed;

    var pointTriangleLL = predictPositionBall(
        cone.pointL,
        vecB,
        cone.frameEnd - cone.frameStart
    );
    pointTriangleLL.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * vecB.x) / speed;
    pointTriangleLL.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * vecB.y) / speed;

    var pointTriangleR = predictPositionBall(
        cone.pointR,
        cone.vecR,
        cone.frameEnd - cone.frameStart
    );
    pointTriangleR.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecR.x) / speed;
    pointTriangleR.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * cone.vecR.y) / speed;

    var pointTriangleRR = predictPositionBall(
        cone.pointR,
        -vecB,
        cone.frameEnd - cone.frameStart
    );
    pointTriangleRR.x +=
        ((triggerDistance + 4 + 2 * playerRadius) * -vecB.x) / speed;
    pointTriangleRR.y +=
        ((triggerDistance + 4 + 2 * playerRadius) * -vecB.y) / speed;

    var triangleL = {
        x1: cone.pointL.x,
        y1: cone.pointL.y,
        x2: pointTriangleLL.x,
        y2: pointTriangleLL.y,
        x3: pointTriangleL.x,
        y3: pointTriangleL.y,
    };
    var triangleR = {
        x1: cone.pointR.x,
        y1: cone.pointR.y,
        x2: pointTriangleRR.x,
        y2: pointTriangleRR.y,
        x3: pointTriangleR.x,
        y3: pointTriangleR.y,
    };
    if (
        checkPointInCone(cone, segL) ||
        checkPointInCone(cone, segR) ||
        (checkPointInTriangle(segL, triangleL) &&
            checkPointInTriangle(segR, triangleR)) ||
        (checkPointInTriangle(segR, triangleL) &&
            checkPointInTriangle(segL, triangleR))
    )
        return true;
    return false;
}

function calculateConeAndType(discs, player) {
    var stadiumDiscs = discs.filter(
        (d) =>
            ((d.cGroup & haxball.collisionFlags.red) == 0 &&
                (d.cGroup & haxball.collisionFlags.blue) == 0) ||
            d.cGroup == haxball.collisionFlags.all
    );
    stadiumDiscs = JSON.parse(JSON.stringify(stadiumDiscs));
    var k = 0;
    while (
        Math.sqrt(stadiumDiscs[0].xspeed ** 2 + stadiumDiscs[0].yspeed ** 2) >=
        0.46
    ) {
        stepStat(stadiumDiscs, k);
        k++;
    }
    getTypeKick();
}

function calculateCone(position, speed, frame) {
    var angle = 2.5;
    var pointDistance = triggerDistance + 4;
    var uncertaintyFactor = 1.05;
    var frameFactor = 1.0001;
    var vecL = getVectorAngle(speed.x, speed.y, degreeToRadian(angle));
    var vecR = getVectorAngle(speed.x, speed.y, -degreeToRadian(angle));
    var vecB = {
        x: -speed.y,
        y: speed.x,
    };
    var pointL = {
        x:
            position.x -
            (vecB.x / normObj(vecB)) *
                (pointDistance * frameFactor ** frame * uncertaintyFactor),
        y:
            position.y -
            (vecB.y / normObj(vecB)) *
                (pointDistance * frameFactor ** frame * uncertaintyFactor),
    };
    var pointR = {
        x:
            position.x +
            (vecB.x / normObj(vecB)) *
                (pointDistance * frameFactor ** frame * uncertaintyFactor),
        y:
            position.y +
            (vecB.y / normObj(vecB)) *
                (pointDistance * frameFactor ** frame * uncertaintyFactor),
    };
    var coneElement = new ConeElement(
        position,
        speed,
        pointL,
        vecL,
        pointR,
        vecR,
        position,
        frame,
        Infinity,
        []
    );
    return coneElement;
}

function deepEqual(x, y) {
    const ok = Object.keys,
        tx = typeof x,
        ty = typeof y;
    return x && y && tx === 'object' && tx === ty
        ? ok(x).length === ok(y).length &&
              ok(x).every((key) => deepEqual(x[key], y[key]))
        : x === y;
}

function getTypeKick() {
    /** TODO:
     * Improve shot: currently too wide
     * Add interception
     * Add rocket
     * Add corner duel kick
     * Rename clearance to good clearance and add bad clearance(when there is opponent in one of the cones of the clear)
     * Rename shot to wide shot and add close shot (with lower angle and closer left/right points)
     **/
    var kick = kickArray[kickArray.length - 1];
    var previousKick =
        kickArray.length > 1 ? kickArray[kickArray.length - 2] : null;
    var playerPos = { x: kick.player.disc.x, y: kick.player.disc.y };
    for (let i = 0; i < kick.coneArray.length; i++) {
        var cone = kick.coneArray[i];
        for (let j = 0; j < kick.playerDiscs.length; j++) {
            var playerDisc = kick.playerDiscs[j];
            if (checkPointInCone(cone, { x: playerDisc.x, y: playerDisc.y }))
                cone.playersRange.push(playerDisc);
        }
    }
    var stringArray = [`Kick n°${kickArray.length - 1}:`];
    if (
        kick.coneArray[0].playersRange.some(
            (d) =>
                ((d.cGroup & haxball.collisionFlags.red) != 0 &&
                    kick.player.team === haxball.Team.RED) ||
                ((d.cGroup & haxball.collisionFlags.blue) != 0 &&
                    kick.player.team === haxball.Team.BLUE)
        )
    ) {
        kick.types.push(Kick.PASS);
        stringArray.push(`Direct pass.`);
    }
    if (
        kick.coneArray
            .slice(1)
            .some((c) =>
                c.playersRange
                    .filter(
                        (d) =>
                            pointDistance({ x: d.x, y: d.y }, playerPos) >
                            2 * playerRadius
                    )
                    .some(
                        (d) =>
                            ((d.cGroup & haxball.collisionFlags.red) != 0 &&
                                kick.player.team === haxball.Team.RED) ||
                            ((d.cGroup & haxball.collisionFlags.blue) != 0 &&
                                kick.player.team === haxball.Team.BLUE)
                    )
            )
    ) {
        kick.types.push(Kick.REBOUND_PASS);
        stringArray.push(`Rebound pass.`);
    }
    if (
        kick.coneArray
            .slice(1)
            .some((c) =>
                c.playersRange
                    .filter(
                        (d) =>
                            pointDistance({ x: d.x, y: d.y }, playerPos) <=
                            2 * playerRadius
                    )
                    .some(
                        (d) =>
                            ((d.cGroup & haxball.collisionFlags.red) != 0 &&
                                kick.player.team === haxball.Team.RED) ||
                            ((d.cGroup & haxball.collisionFlags.blue) != 0 &&
                                kick.player.team === haxball.Team.BLUE)
                    )
            )
    ) {
        kick.types.push(Kick.REBOUND_DRIBBLE);
        stringArray.push(`Rebound dribble.`);
    }
    if (
        kick.coneArray.every((c) => c.playersRange.length == 0) &&
        ((Math.abs(getAngleVec(kick.speed, { x: 1, y: 0 })) < 75 &&
            kick.position.x < 200 / 2 &&
            kick.player.team == haxball.Team.RED) ||
            (Math.abs(getAngleVec(kick.speed, { x: -1, y: 0 })) < 75 &&
                kick.position.x > -200 / 2 &&
                kick.player.team == haxball.Team.BLUE))
    ) {
        kick.types.push(Kick.REBOUND_PASS);
        stringArray.push(`Clearance kick.`);
    }
    var shotKick = false;
    var goalObj = kick.player.team == haxball.Team.RED ? goals[1] : goals[0];
    for (let i = 0; i < kick.coneArray.length; i++) {
        var cone = kick.coneArray[i];
        var p1 = {
            x: goalObj.p0[0],
            y: goalObj.p0[1],
        };
        var p2 = {
            x: goalObj.p1[0],
            y: goalObj.p1[1],
        };
        if (
            checkSegmentInCone(cone, p1, p2) &&
            ((cone.speed.x > 0 && kick.player.team == haxball.Team.RED) ||
                (cone.speed.x < 0 && kick.player.team == haxball.Team.BLUE))
        )
            shotKick = true;
    }
    if (shotKick) {
        kick.types.push(Kick.SHOT);
        stringArray.push(`Shot kick.`);
    }
    if (
        kick.coneArray[0].playersRange.some(
            (d) =>
                pointDistance(playerPos, { x: d.x, y: d.y }) < 8 * 15 + 10 &&
                (((d.cGroup & haxball.collisionFlags.red) != 0 &&
                    kick.player.team === haxball.Team.BLUE) ||
                    ((d.cGroup & haxball.collisionFlags.blue) != 0 &&
                        kick.player.team === haxball.Team.RED))
        )
    ) {
        kick.types.push(Kick.OPEN_DUEL);
        stringArray.push(`Open play duel kick.`);
    }
    if (
        previousKick != null &&
        previousKick.player.team == kick.player.team &&
        kick.time - previousKick.time < 1 / 6
    ) {
        kick.types.push(Kick.ROCKET);
        stringArray.push(`Rocket kick.`);
    }

    console.log(stringArray.join(' '));
}

function radianToDegree(x) {
    return x * (180 / Math.PI);
}

function degreeToRadian(x) {
    return x * (Math.PI / 180);
}

function getAngle(x, y) {
    return radianToDegree(Math.atan2(y, x));
}

function getAngleVec(vec1, vec2) {
    return radianToDegree(
        Math.atan2(vec2.y, vec2.x) - Math.atan2(vec1.y, vec1.x)
    );
}

function getVectorAngle(x, y, angle) {
    return {
        x: x * Math.cos(angle) + y * Math.sin(angle),
        y: y * Math.cos(angle) - x * Math.sin(angle),
    };
}

function normArr(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function normObj(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function pointDistance(p1, p2) {
    var d1 = p1.x - p2.x;
    var d2 = p1.y - p2.y;
    return Math.sqrt(d1 * d1 + d2 * d2);
}

function predictPositionBall(position, speed, frames) {
    var sum = (1 - discs[0].damping ** frames) / (1 - discs[0].damping);
    var x_new = position.x + speed.x * sum;
    var y_new = position.y + speed.y * sum;
    return { x: x_new, y: y_new };
}

setInterval(() => {
    window.requestAnimationFrame(draw);
}, 1000 / 60);
