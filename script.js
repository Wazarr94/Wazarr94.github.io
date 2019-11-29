// TODO : Collision system with cMask, cGroup, binary stuff
// TODO : Finish physics system
// TODO : Better frame animation system
// TODO : FIX ANTIALIASING + avatar
// TODO : Menu
// TODO : Recording system which lets us test physics

var canvas = document.getElementById("canvas_div");
var ctx = canvas.getContext("2d", { alpha : true });

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
ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";

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
    disc_color: 'rgb(255,255,255)',
    default_disc_radius: 10,
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
        kickStrength: 5

    },
    ballPhysics: {
        radius: 10,
        bCoef: 0.5,
        invMass: 1,
        damping: 0.99,
        color: "FFFFFF",
        cMask: ["all"],
        cGroup: ["ball"]
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

var properties = (function(p) {return {
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
};})(function(required, type, nodefault) {
    return { required: required, type: type, def: !nodefault };
});

var type_properties = {
    vertexes: ['x', 'y', 'bCoef', 'cMask', 'cGroup', 'trait'],
    segments: ['v0', 'v1', 'curve', 'vis', 'color', 'bCoef', 'cMask', 'cGroup', 'trait'],
    planes: ['normal', 'dist', 'bCoef', 'cMask', 'cGroup', 'trait'],
    discs: ['radius', 'invMass', 'pos', 'color',  'bCoef', 'cMask', 'cGroup', 'trait', 'damping', 'speed'], 
    goals: ['p0', 'p1', 'team']
};

var stadium = JSON.parse(`{"name":"Classic","width":420,"height":200,"spawnDistance":170,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
var stadium2 = JSON.parse(`{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]}}}`);
var stadium3 = JSON.parse(`{"name":"Car Racing Race Points from HaxMaps","width":1200,"height":600,"spawnDistance":1120,"bg":{"type":"hockey","width":0,"height":0,"kickOffRadius":0,"cornerRadius":0},"vertexes":[{"x":268,"y":48,"trait":"ready_vertex"},{"x":268,"y":48,"trait":"wall_vertex","_selected":"segment"},{"x":268,"y":208,"trait":"wall_vertex","_selected":"segment"},{"x":616,"y":208,"trait":"wall_vertex","color":"3366cc","cMask":["ball"]},{"x":-18,"y":208,"trait":"wall_vertex"},{"x":-47,"y":220,"trait":"wall_vertex"},{"x":-304,"y":477,"trait":"wall_vertex"},{"x":-446,"y":536,"trait":"wall_vertex"},{"x":-1136,"y":536,"trait":"wall_vertex"},{"x":-1136,"y":376,"trait":"wall_vertex"},{"x":-1040,"y":376,"trait":"wall_vertex"},{"x":-1008,"y":344,"trait":"wall_vertex"},{"x":-1008,"y":0,"trait":"wall_vertex"},{"x":-1013,"y":-21,"trait":"wall_vertex"},{"x":-1131,"y":-257,"trait":"wall_vertex"},{"x":-1136,"y":-278,"trait":"wall_vertex"},{"x":-1136,"y":-290,"trait":"wall_vertex"},{"x":-716,"y":-464,"trait":"wall_vertex"},{"x":-616,"y":-364,"trait":"wall_vertex"},{"x":-576,"y":-267,"trait":"wall_vertex"},{"x":-576,"y":-167,"trait":"wall_vertex"},{"x":-544,"y":-167,"trait":"wall_vertex"},{"x":-544,"y":-407,"trait":"wall_vertex"},{"x":-342,"y":-504,"trait":"wall_vertex"},{"x":-142,"y":-304,"trait":"wall_vertex"},{"x":-88,"y":-295,"trait":"wall_vertex"},{"x":112,"y":-395,"trait":"wall_vertex"},{"x":124,"y":-404,"trait":"wall_vertex"},{"x":216,"y":-496,"trait":"wall_vertex"},{"x":313,"y":-536,"trait":"wall_vertex"},{"x":1004,"y":-536,"trait":"wall_vertex"},{"x":1127,"y":-485,"trait":"red_wall"},{"x":1160,"y":-452,"trait":"red_wall"},{"x":1200,"y":-355,"trait":"wall_vertex"},{"x":1200,"y":176,"trait":"wall_vertex"},{"x":1004,"y":240,"trait":"wall_vertex"},{"x":268,"y":240,"trait":"wall_vertex"},{"x":1003,"y":240,"trait":"wall_vertex","color":"3366cc","cMask":["ball"]},{"x":1072,"y":-112,"trait":"wall_vertex"},{"x":1072,"y":-20,"trait":"wall_vertex"},{"x":1004,"y":48,"trait":"wall_vertex"},{"x":-18,"y":48,"trait":"wall_vertex"},{"x":-160,"y":107,"trait":"wall_vertex"},{"x":-417,"y":364,"trait":"wall_vertex"},{"x":-446,"y":376,"trait":"wall_vertex"},{"x":-848,"y":376,"trait":"wall_vertex"},{"x":-912,"y":312,"trait":"wall_vertex"},{"x":-912,"y":0,"trait":"wall_vertex"},{"x":-927,"y":-64,"trait":"wall_vertex"},{"x":-1023,"y":-256,"trait":"wall_vertex"},{"x":-1028,"y":-277,"trait":"wall_vertex"},{"x":-1028,"y":-290,"trait":"wall_vertex"},{"x":-784,"y":-396,"trait":"wall_vertex"},{"x":-684,"y":-296,"trait":"wall_vertex"},{"x":-672,"y":-267,"trait":"wall_vertex"},{"x":-672,"y":-167,"trait":"wall_vertex"},{"x":-464,"y":-167,"trait":"wall_vertex"},{"x":-464,"y":-407,"trait":"wall_vertex"},{"x":-410,"y":-436,"trait":"wall_vertex"},{"x":-210,"y":-236,"trait":"wall_vertex"},{"x":-45,"y":-209,"trait":"wall_vertex"},{"x":155,"y":-309,"trait":"wall_vertex"},{"x":192,"y":-336,"trait":"wall_vertex"},{"x":284,"y":-428,"trait":"wall_vertex"},{"x":313,"y":-440,"trait":"wall_vertex"},{"x":1004,"y":-440,"trait":"wall_vertex","curve":90,"cMask":["red","blue"],"color":"303030"},{"x":1072,"y":-372,"trait":"wall_vertex"},{"x":1072,"y":-144,"trait":"wall_vertex"},{"x":1040,"y":-112,"trait":"inner_track_vertex"},{"x":1040,"y":-36,"trait":"inner_track_vertex"},{"x":988,"y":16,"trait":"inner_track_vertex"},{"x":-18,"y":16,"trait":"inner_track_vertex"},{"x":-183,"y":84,"trait":"inner_track_vertex"},{"x":-423,"y":324,"trait":"inner_track_vertex"},{"x":-469,"y":344,"trait":"inner_track_vertex"},{"x":-832,"y":344,"trait":"inner_track_vertex"},{"x":-880,"y":296,"trait":"inner_track_vertex"},{"x":-880,"y":0,"trait":"inner_track_vertex"},{"x":-898,"y":-78,"trait":"inner_track_vertex"},{"x":-987,"y":-256,"trait":"inner_track_vertex"},{"x":-996,"y":-290,"trait":"inner_track_vertex"},{"x":-807,"y":-373,"trait":"inner_track_vertex"},{"x":-723,"y":-289,"trait":"inner_track_vertex"},{"x":-704,"y":-243,"trait":"inner_track_vertex"},{"x":-704,"y":-167,"trait":"inner_track_vertex"},{"x":-432,"y":-167,"trait":"inner_track_vertex"},{"x":-432,"y":-214,"trait":"inner_track_vertex"},{"x":-292,"y":-272,"trait":"inner_track_vertex"},{"x":-233,"y":-213,"trait":"inner_track_vertex"},{"x":-31,"y":-181,"trait":"inner_track_vertex"},{"x":169,"y":-281,"trait":"inner_track_vertex"},{"x":215,"y":-313,"trait":"inner_track_vertex"},{"x":291,"y":-389,"trait":"inner_track_vertex"},{"x":337,"y":-408,"trait":"inner_track_vertex"},{"x":988,"y":-408,"trait":"inner_track_vertex"},{"x":1040,"y":-356,"trait":"inner_track_vertex"},{"x":1040,"y":-144,"trait":"inner_track_vertex"},{"x":1008,"y":-112,"trait":"inner_track_vertex"},{"x":1008,"y":-36,"trait":"inner_track_vertex"},{"x":988,"y":-16,"trait":"inner_track_vertex"},{"x":-18,"y":-16,"trait":"inner_track_vertex"},{"x":-206,"y":61,"trait":"inner_track_vertex"},{"x":-446,"y":301,"trait":"inner_track_vertex"},{"x":-469,"y":312,"trait":"inner_track_vertex"},{"x":-832,"y":312,"trait":"inner_track_vertex"},{"x":-848,"y":296,"trait":"inner_track_vertex"},{"x":-848,"y":0,"trait":"inner_track_vertex"},{"x":-870,"y":-93,"trait":"inner_track_vertex"},{"x":-959,"y":-271,"trait":"inner_track_vertex"},{"x":-964,"y":-290,"trait":"inner_track_vertex"},{"x":-830,"y":-350,"trait":"inner_track_vertex"},{"x":-746,"y":-266,"trait":"inner_track_vertex"},{"x":-736,"y":-243,"trait":"inner_track_vertex"},{"x":-736,"y":-167,"trait":"inner_track_vertex"},{"x":-400,"y":-167,"trait":"inner_track_vertex"},{"x":-400,"y":-214,"trait":"inner_track_vertex"},{"x":-315,"y":-249,"trait":"inner_track_vertex"},{"x":-256,"y":-190,"trait":"inner_track_vertex"},{"x":-17,"y":-153,"trait":"inner_track_vertex"},{"x":183,"y":-253,"trait":"inner_track_vertex"},{"x":238,"y":-290,"trait":"inner_track_vertex"},{"x":314,"y":-366,"trait":"inner_track_vertex"},{"x":337,"y":-376,"trait":"inner_track_vertex"},{"x":988,"y":-376,"trait":"inner_track_vertex"},{"x":1008,"y":-356,"trait":"inner_track_vertex"},{"x":1008,"y":-144,"trait":"inner_track_vertex"},{"x":274,"y":257,"trait":"word_vertex"},{"x":280,"y":252,"trait":"word_vertex"},{"x":280,"y":273,"trait":"word_vertex"},{"x":274,"y":256,"trait":"word_vertex"},{"x":279,"y":254,"trait":"word_vertex"},{"x":279,"y":273,"trait":"word_vertex"},{"x":301,"y":252,"trait":"word_vertex"},{"x":313,"y":252,"trait":"word_vertex"},{"x":313,"y":263,"trait":"word_vertex"},{"x":302,"y":263,"trait":"word_vertex"},{"x":302,"y":272,"trait":"word_vertex"},{"x":313,"y":272,"trait":"word_vertex"},{"x":301,"y":253,"trait":"word_vertex"},{"x":312,"y":253,"trait":"word_vertex"},{"x":312,"y":262,"trait":"word_vertex"},{"x":301,"y":262,"trait":"word_vertex"},{"x":301,"y":273,"trait":"word_vertex"},{"x":313,"y":273,"trait":"word_vertex"},{"x":330,"y":252,"trait":"word_vertex"},{"x":343,"y":252,"trait":"word_vertex"},{"x":330,"y":262,"trait":"word_vertex"},{"x":343,"y":262,"trait":"word_vertex"},{"x":330,"y":272,"trait":"word_vertex"},{"x":343,"y":272,"trait":"word_vertex"},{"x":330,"y":253,"trait":"word_vertex"},{"x":343,"y":253,"trait":"word_vertex"},{"x":330,"y":263,"trait":"word_vertex"},{"x":343,"y":263,"trait":"word_vertex"},{"x":330,"y":273,"trait":"word_vertex"},{"x":343,"y":273,"trait":"word_vertex"},{"x":956,"y":259,"trait":"word_vertex"},{"x":936,"y":279,"trait":"word_vertex"},{"x":1008,"y":279,"trait":"word_vertex"},{"x":956,"y":260,"trait":"word_vertex"},{"x":936,"y":280,"trait":"word_vertex"},{"x":1008,"y":280,"trait":"word_vertex"},{"x":1025,"y":259,"trait":"word_vertex"},{"x":1038,"y":259,"trait":"word_vertex"},{"x":1025,"y":269,"trait":"word_vertex"},{"x":1038,"y":269,"trait":"word_vertex"},{"x":1025,"y":280,"trait":"word_vertex"},{"x":1026,"y":260,"trait":"word_vertex"},{"x":1038,"y":260,"trait":"word_vertex"},{"x":1025,"y":270,"trait":"word_vertex"},{"x":1038,"y":270,"trait":"word_vertex"},{"x":1026,"y":280,"trait":"word_vertex"},{"x":1048,"y":259,"trait":"word_vertex"},{"x":1048,"y":280,"trait":"word_vertex"},{"x":1049,"y":259,"trait":"word_vertex"},{"x":1049,"y":280,"trait":"word_vertex"},{"x":1059,"y":280,"trait":"word_vertex"},{"x":1059,"y":259,"trait":"word_vertex"},{"x":1071,"y":280,"trait":"word_vertex"},{"x":1071,"y":259,"trait":"word_vertex"},{"x":1060,"y":280,"trait":"word_vertex"},{"x":1060,"y":259,"trait":"word_vertex"},{"x":1072,"y":280,"trait":"word_vertex"},{"x":1072,"y":259,"trait":"word_vertex"},{"x":1082,"y":259,"trait":"word_vertex"},{"x":1082,"y":280,"trait":"word_vertex"},{"x":1083,"y":259,"trait":"word_vertex"},{"x":1083,"y":280,"trait":"word_vertex"},{"x":1106,"y":259,"trait":"word_vertex"},{"x":1093,"y":259,"trait":"word_vertex"},{"x":1093,"y":270,"trait":"word_vertex"},{"x":1105,"y":270,"trait":"word_vertex"},{"x":1105,"y":279,"trait":"word_vertex"},{"x":1093,"y":279,"trait":"word_vertex"},{"x":1106,"y":260,"trait":"word_vertex"},{"x":1094,"y":260,"trait":"word_vertex"},{"x":1094,"y":269,"trait":"word_vertex"},{"x":1106,"y":269,"trait":"word_vertex"},{"x":1106,"y":280,"trait":"word_vertex"},{"x":1093,"y":280,"trait":"word_vertex"},{"x":1116,"y":259,"trait":"word_vertex"},{"x":1116,"y":280,"trait":"word_vertex"},{"x":1116,"y":269,"trait":"word_vertex"},{"x":1128,"y":269,"trait":"word_vertex"},{"x":1128,"y":259,"trait":"word_vertex"},{"x":1128,"y":280,"trait":"word_vertex"},{"x":1117,"y":259,"trait":"word_vertex"},{"x":1117,"y":280,"trait":"word_vertex"},{"x":1117,"y":270,"trait":"word_vertex"},{"x":1129,"y":270,"trait":"word_vertex"},{"x":1129,"y":259,"trait":"word_vertex"},{"x":1129,"y":280,"trait":"word_vertex"},{"bCoef":0.25,"cMask":["red","blue","ball"],"x":268,"y":240},{"bCoef":0.25,"cMask":["red","blue","ball"],"trait":"wall_vertex","x":673,"y":208,"curve":100},{"bCoef":0.25,"cMask":["ball"],"trait":"wall_vertex","x":1003,"y":208,"color":"3366cc"},{"bCoef":0.25,"cMask":["red","blue","ball"],"trait":"wall_vertex","x":641,"y":165,"curve":100},{"bCoef":0.25,"cMask":["ball"],"trait":"wall_vertex","x":616,"y":165,"color":"3366cc"},{"x":610,"y":227,"curve":-110,"cMask":["ball"]},{"x":649,"y":196,"curve":-110,"cMask":["ball"]},{"x":650,"y":196,"cMask":["ball"]},{"x":662,"y":209,"cMask":["ball"]},{"x":650,"y":196,"cMask":["ball"]},{"x":635,"y":206,"cMask":["ball"]},{"bCoef":1,"trait":"word_vertex","x":954,"y":302}],"segments":[{"v0":1,"v1":2,"vis":true,"bCoef":0,"cGroup":["redKO","blueKO"],"cMask":["red","blue"],"color":"FFFFFF","_selected":true},{"v0":3,"v1":4,"trait":"wall"},{"v0":4,"v1":5,"trait":"wall","curve":-45},{"v0":5,"v1":6,"trait":"wall"},{"v0":6,"v1":7,"trait":"wall","curve":45},{"v0":7,"v1":8,"trait":"wall"},{"v0":8,"v1":9,"trait":"wall"},{"v0":9,"v1":10,"trait":"wall"},{"v0":10,"v1":11,"trait":"wall","curve":-90},{"v0":11,"v1":12,"trait":"wall"},{"v0":12,"v1":13,"trait":"wall","curve":-26.5650511771},{"v0":13,"v1":14,"trait":"wall"},{"v0":14,"v1":15,"trait":"wall","curve":26.5650511771},{"v0":15,"v1":16,"trait":"wall"},{"v0":16,"v1":17,"trait":"wall","curve":135},{"v0":17,"v1":18,"trait":"wall"},{"v0":18,"v1":19,"trait":"wall","curve":45},{"v0":19,"v1":20,"trait":"wall"},{"v0":20,"v1":21,"trait":"wall","curve":-180},{"v0":21,"v1":22,"trait":"wall"},{"v0":22,"v1":23,"trait":"wall","curve":135},{"v0":23,"v1":24,"trait":"wall"},{"v0":24,"v1":25,"trait":"wall","curve":-63.4349488229},{"v0":25,"v1":26,"trait":"wall"},{"v0":26,"v1":27,"trait":"wall","curve":-26.5650511771},{"v0":27,"v1":28,"trait":"wall"},{"v0":28,"v1":29,"trait":"wall","curve":45},{"v0":29,"v1":30,"trait":"wall"},{"v0":30,"v1":31,"trait":"wall","curve":45},{"v0":31,"v1":32,"trait":"red_wall"},{"v0":32,"v1":33,"trait":"wall","curve":45},{"v0":33,"v1":34,"trait":"wall"},{"v0":34,"v1":35,"trait":"wall","curve":70.5287793655},{"v0":36,"v1":37,"trait":"wall"},{"v0":38,"v1":39,"trait":"wall"},{"v0":39,"v1":40,"trait":"wall","curve":90},{"v0":40,"v1":41,"trait":"wall"},{"v0":41,"v1":42,"trait":"wall","curve":-45},{"v0":42,"v1":43,"trait":"wall"},{"v0":43,"v1":44,"trait":"wall","curve":45},{"v0":44,"v1":45,"trait":"wall"},{"v0":45,"v1":46,"trait":"wall","curve":90},{"v0":46,"v1":47,"trait":"wall"},{"v0":47,"v1":48,"trait":"wall","curve":-26.5650511771},{"v0":48,"v1":49,"trait":"wall"},{"v0":49,"v1":50,"trait":"wall","curve":26.5650511771},{"v0":50,"v1":51,"trait":"wall"},{"v0":51,"v1":52,"trait":"wall","curve":135},{"v0":52,"v1":53,"trait":"wall"},{"v0":53,"v1":54,"trait":"wall","curve":45},{"v0":54,"v1":55,"trait":"wall"},{"v0":55,"v1":56,"trait":"wall","curve":-180},{"v0":56,"v1":57,"trait":"wall"},{"v0":57,"v1":58,"trait":"wall","curve":135},{"v0":58,"v1":59,"trait":"wall"},{"v0":59,"v1":60,"trait":"wall","curve":-63.4349488229},{"v0":60,"v1":61,"trait":"wall"},{"v0":61,"v1":62,"trait":"wall","curve":-26.5650511771},{"v0":62,"v1":63,"trait":"wall"},{"v0":63,"v1":64,"trait":"wall","curve":45},{"v0":64,"v1":65,"trait":"wall"},{"v0":65,"v1":66,"trait":"wall","curve":90},{"v0":66,"v1":67,"trait":"wall"},{"v0":68,"v1":69,"trait":"inner_track"},{"v0":69,"v1":70,"trait":"inner_track","curve":90},{"v0":70,"v1":71,"trait":"inner_track"},{"v0":71,"v1":72,"trait":"inner_track","curve":-45},{"v0":72,"v1":73,"trait":"inner_track"},{"v0":73,"v1":74,"trait":"inner_track","curve":45},{"v0":74,"v1":75,"trait":"inner_track"},{"v0":75,"v1":76,"trait":"inner_track","curve":90},{"v0":76,"v1":77,"trait":"inner_track"},{"v0":77,"v1":78,"trait":"inner_track","curve":-26.5650511771},{"v0":78,"v1":79,"trait":"inner_track"},{"v0":79,"v1":80,"trait":"inner_track","curve":26.5650511771},{"v0":80,"v1":81,"trait":"inner_track","curve":135},{"v0":81,"v1":82,"trait":"inner_track"},{"v0":82,"v1":83,"trait":"inner_track","curve":45},{"v0":83,"v1":84,"trait":"inner_track"},{"v0":84,"v1":85,"trait":"inner_track","curve":-180},{"v0":85,"v1":86,"trait":"inner_track"},{"v0":86,"v1":87,"trait":"inner_track","curve":135},{"v0":87,"v1":88,"trait":"inner_track"},{"v0":88,"v1":89,"trait":"inner_track","curve":-63.4349488229},{"v0":89,"v1":90,"trait":"inner_track"},{"v0":90,"v1":91,"trait":"inner_track","curve":-26.5650511771},{"v0":91,"v1":92,"trait":"inner_track"},{"v0":92,"v1":93,"trait":"inner_track","curve":45},{"v0":93,"v1":94,"trait":"inner_track"},{"v0":94,"v1":95,"trait":"inner_track","curve":90},{"v0":95,"v1":96,"trait":"inner_track"},{"v0":97,"v1":98,"trait":"inner_track"},{"v0":98,"v1":99,"trait":"inner_track","curve":90},{"v0":99,"v1":100,"trait":"inner_track"},{"v0":100,"v1":101,"trait":"inner_track","curve":-45},{"v0":101,"v1":102,"trait":"inner_track"},{"v0":102,"v1":103,"trait":"inner_track","curve":45},{"v0":103,"v1":104,"trait":"inner_track"},{"v0":104,"v1":105,"trait":"inner_track","curve":90},{"v0":105,"v1":106,"trait":"inner_track"},{"v0":106,"v1":107,"trait":"inner_track","curve":-26.5650511771},{"v0":107,"v1":108,"trait":"inner_track"},{"v0":108,"v1":109,"trait":"inner_track","curve":26.5650511771},{"v0":109,"v1":110,"trait":"inner_track","curve":135},{"v0":110,"v1":111,"trait":"inner_track"},{"v0":111,"v1":112,"trait":"inner_track","curve":45},{"v0":112,"v1":113,"trait":"inner_track"},{"v0":113,"v1":114,"trait":"inner_track","curve":-180},{"v0":114,"v1":115,"trait":"inner_track"},{"v0":115,"v1":116,"trait":"inner_track","curve":135},{"v0":116,"v1":117,"trait":"inner_track"},{"v0":117,"v1":118,"trait":"inner_track","curve":-63.4349488229},{"v0":118,"v1":119,"trait":"inner_track"},{"v0":119,"v1":120,"trait":"inner_track","curve":-26.5650511771},{"v0":120,"v1":121,"trait":"inner_track"},{"v0":121,"v1":122,"trait":"inner_track","curve":45},{"v0":122,"v1":123,"trait":"inner_track"},{"v0":123,"v1":124,"trait":"inner_track","curve":90},{"v0":124,"v1":125,"trait":"inner_track"},{"v0":30,"v1":65,"trait":"init_bound"},{"v0":38,"v1":68,"trait":"init_bound"},{"v0":67,"v1":38,"trait":"wall"},{"v0":67,"v1":125,"trait":"init_bound"},{"v0":97,"v1":125,"trait":"init_bound"},{"v0":126,"v1":127,"trait":"word_1"},{"v0":127,"v1":128,"trait":"word_1"},{"v0":129,"v1":130,"trait":"word_1"},{"v0":130,"v1":131,"trait":"word_1"},{"v0":132,"v1":133,"trait":"word_2"},{"v0":133,"v1":134,"trait":"word_2"},{"v0":134,"v1":135,"trait":"word_2"},{"v0":135,"v1":136,"trait":"word_2"},{"v0":136,"v1":137,"trait":"word_2"},{"v0":138,"v1":139,"trait":"word_2"},{"v0":139,"v1":140,"trait":"word_2"},{"v0":140,"v1":141,"trait":"word_2"},{"v0":141,"v1":142,"trait":"word_2"},{"v0":142,"v1":143,"trait":"word_2"},{"v0":144,"v1":145,"trait":"word_3"},{"v0":146,"v1":147,"trait":"word_3"},{"v0":148,"v1":149,"trait":"word_3"},{"v0":145,"v1":149,"trait":"word_3"},{"v0":150,"v1":151,"trait":"word_3"},{"v0":152,"v1":153,"trait":"word_3"},{"v0":154,"v1":155,"trait":"word_3"},{"v0":151,"v1":155,"trait":"word_3"},{"v0":156,"v1":157,"trait":"word_finish"},{"v0":157,"v1":158,"trait":"word_finish"},{"v0":159,"v1":160,"trait":"word_finish"},{"v0":160,"v1":161,"trait":"word_finish"},{"v0":162,"v1":163,"trait":"word_finish"},{"v0":164,"v1":165,"trait":"word_finish"},{"v0":162,"v1":166,"trait":"word_finish"},{"v0":167,"v1":168,"trait":"word_finish"},{"v0":169,"v1":170,"trait":"word_finish"},{"v0":167,"v1":171,"trait":"word_finish"},{"v0":172,"v1":173,"trait":"word_finish"},{"v0":174,"v1":175,"trait":"word_finish"},{"v0":176,"v1":177,"trait":"word_finish"},{"v0":177,"v1":178,"trait":"word_finish"},{"v0":178,"v1":179,"trait":"word_finish"},{"v0":180,"v1":181,"trait":"word_finish"},{"v0":181,"v1":182,"trait":"word_finish"},{"v0":182,"v1":183,"trait":"word_finish"},{"v0":184,"v1":185,"trait":"word_finish"},{"v0":186,"v1":187,"trait":"word_finish"},{"v0":188,"v1":189,"trait":"word_finish"},{"v0":189,"v1":190,"trait":"word_finish"},{"v0":190,"v1":191,"trait":"word_finish"},{"v0":191,"v1":192,"trait":"word_finish"},{"v0":192,"v1":193,"trait":"word_finish"},{"v0":194,"v1":195,"trait":"word_finish"},{"v0":195,"v1":196,"trait":"word_finish"},{"v0":196,"v1":197,"trait":"word_finish"},{"v0":197,"v1":198,"trait":"word_finish"},{"v0":198,"v1":199,"trait":"word_finish"},{"v0":200,"v1":201,"trait":"word_finish"},{"v0":202,"v1":203,"trait":"word_finish"},{"v0":204,"v1":205,"trait":"word_finish"},{"v0":206,"v1":207,"trait":"word_finish"},{"v0":208,"v1":209,"trait":"word_finish"},{"v0":210,"v1":211,"trait":"word_finish"},{"vis":true,"color":"303030","bCoef":0.25,"cMask":["red","blue","ball"],"v0":2,"v1":212},{"vis":true,"color":"303030","bCoef":0.25,"cMask":["red","blue","ball"],"trait":"wall_vertex","v0":213,"v1":214},{"vis":true,"color":"303030","bCoef":0.25,"cMask":["red","blue","ball"],"trait":"wall_vertex","v0":215,"v1":213,"curve":100},{"vis":true,"color":"303030","bCoef":0.25,"cMask":["red","blue","ball"],"trait":"wall_vertex","v0":216,"v1":215},{"vis":true,"color":"3366cc","v0":216,"v1":3,"cMask":["ball"]},{"vis":true,"color":"FFFFFF","v0":217,"v1":218,"curve":-110,"cMask":["ball"]},{"vis":true,"color":"FFFFFF","v0":219,"v1":220,"cMask":["ball"]},{"vis":true,"color":"FFFFFF","v0":221,"v1":222,"cMask":["ball"]},{"vis":true,"color":"CCCCCC","bCoef":1,"trait":"word_vertex","v0":160,"v1":223},{"vis":true,"color":"3366cc","v0":37,"v1":214,"cMask":["ball"]}],"goals":[],"discs":[{"pos":[-1122,507],"trait":"cushion"},{"pos":[-1122,481],"trait":"cushion"},{"pos":[-1122,455],"trait":"cushion"},{"pos":[-1122,429],"trait":"cushion"},{"pos":[-1122,403],"trait":"cushion"},{"pos":[-1100,520],"trait":"cushion"},{"pos":[-1100,494],"trait":"cushion"},{"pos":[-1100,468],"trait":"cushion"},{"pos":[-1100,442],"trait":"cushion"},{"pos":[-1100,416],"trait":"cushion"},{"pos":[-1100,390],"trait":"cushion"},{"pos":[-1122,507],"trait":"cushion"},{"pos":[-1122,455],"trait":"cushion"},{"pos":[-1122,403],"trait":"cushion"},{"pos":[-1100,494],"trait":"cushion"},{"pos":[-1100,416],"trait":"cushion"},{"pos":[7500,0],"speed":[-3.9,0],"cMask":["ball"],"bCoef":10,"damping":1}],"planes":[{"normal":[0,1],"dist":-600},{"normal":[0,-1],"dist":-600},{"normal":[1,0],"dist":-1200},{"normal":[-1,0],"dist":-1200}],"traits":{"ready_vertex":{"bCoef":0,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]},"ready":{"vis":true,"bCoef":0,"cGroup":["redKO","blueKO"],"cMask":["red","blue"],"color":"CCCCCC"},"init_bound":{"vis":false,"bCoef":0,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]},"wall_vertex":{"bCoef":0.25,"cMask":["red","blue","ball"]},"wall":{"vis":true,"bCoef":0.25,"cMask":["red","blue","ball"],"color":"303030"},"inner_track_vertex":{"bCoef":1,"cMask":["red","blue","ball"]},"inner_track":{"vis":true,"bCoef":1,"cMask":["red","blue","ball"],"color":"808080"},"word_vertex":{"bCoef":1,"cMask":[""]},"word_1":{"vis":true,"bCoef":1,"cMask":[""],"color":"ff8080"},"word_2":{"vis":true,"bCoef":1,"cMask":[""],"color":"80ff80"},"word_3":{"vis":true,"bCoef":1,"cMask":[""],"color":"8080ff"},"word_finish":{"vis":true,"bCoef":1,"cMask":[""],"color":"CCCCCC"},"red_wall":{"vis":true,"bCoef":0,"cMask":["blue"],"color":"FF4A4A"},"cushion":{"radius":12,"invMass":0.25,"bCoef":0.5,"color":"CCCCCC"}},"playerPhysics":{"bCoef":0.5,"invMass":0.5,"damping":0.985,"acceleration":0.09,"kickingAcceleration":0,"kickingDamping":0.985,"kickStrength":-3},"ballPhysics":{"radius":15,"bCoef":1.0e-21,"invMass":100000,"damping":1.000275,"color":"336699","cMask":["all"],"cGroup":["ball"]}}`);
var playerPhysics = haxball.playerPhysics;
if (stadium.playerPhysics !== undefined) {
    for (const [key, value] of Object.entries(haxball.playerPhysics)) {
        playerPhysics[key] = stadium.playerPhysics[key] == undefined ? value : stadium.playerPhysics[key];
    }
}
var ballPhysics = haxball.ballPhysics;
if (stadium.ballPhysics !== undefined) {
    for (const [key, value] of Object.entries(haxball.ballPhysics)) {
        ballPhysics[key] = stadium.ballPhysics[key] == undefined ? value : stadium.ballPhysics[key];
    }
}
var x =  - 2 * stadium.spawnDistance + 2 * playerPhysics.radius;
var y = 0;
var xspeed = 0;
var yspeed = 0;

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

function keyDownHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = true;
    }
    if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = true;
    }
    if (e.key == "Up" || e.key == "ArrowUp") {
        upPressed = true;
    }
    if (e.key == "Down" || e.key == "ArrowDown") {
        downPressed = true;
    }
    if (e.key == "x") {
        shotPressed = true;
    }
    if (e.key == "&") {
        zoom = zoom_levels[0];
    }
    if (e.key == "é") {
        zoom = zoom_levels[1];
    }
    if (e.key == "\"") {
        zoom = zoom_levels[2];
    }
}

function keyUpHandler(e) {
    if (e.key == "Right" || e.key == "ArrowRight") {
        rightPressed = false;
    }
    if (e.key == "Left" || e.key == "ArrowLeft") {
        leftPressed = false;
    }
    if (e.key == "Up" || e.key == "ArrowUp") {
        upPressed = false;
    }
    if (e.key == "Down" || e.key == "ArrowDown") {
        downPressed = false;
    }
    if (e.key == "x") {
        shotPressed = false;
    }
}

function load_tile(name){
    var tile = new Image(128, 128);
    tile.onload = function(){
        var ctx = canvas.getContext('2d');
        bg_patterns[name] = ctx.createPattern(tile, null);
        render(stadium);
    };
    tile.src = name+'tile.png';
}

function drawMap() {
    resize_canvas();
}

function draw() {
    ctx.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
    drawMap();

    var direction = [0, 0];
    
    if (rightPressed && x < stadium.width - playerPhysics.radius) {
        direction[0]++;
    }
    if (leftPressed && x > -stadium.width + playerPhysics.radius) {
        direction[0]--;
    }
    if (downPressed && y < stadium.height - playerPhysics.radius) {
        direction[1]++;
    }
    if (upPressed && y > -stadium.height + playerPhysics.radius) {
        direction[1]--;
    }

    direction = normalise(direction);

    xspeed = playerPhysics.damping * (xspeed + direction[0] * (shotPressed ? playerPhysics.kickingAcceleration : playerPhysics.acceleration));
    yspeed = playerPhysics.damping * (yspeed + direction[1] * (shotPressed ? playerPhysics.kickingAcceleration : playerPhysics.acceleration));
    x += xspeed;
    y += yspeed;
    
    if (x > stadium.width - playerPhysics.radius) {
        x = stadium.width - playerPhysics.radius;
        xspeed = 0;
    }
    if (x < -stadium.width + playerPhysics.radius) {
        x = -stadium.width + playerPhysics.radius;
        xspeed = 0;
    }
    if (y > stadium.height - playerPhysics.radius) {
        y = stadium.height - playerPhysics.radius;
        yspeed = 0;
    }
    if (y < -stadium.height + playerPhysics.radius) {
        y = -stadium.height + playerPhysics.radius;
        yspeed = 0;
    }
    
    // draw red
    ctx.beginPath();
    ctx.arc(x, y, playerPhysics.radius, 0, Math.PI*2, true);
    ctx.fillStyle = haxball.red_color;
    ctx.strokeStyle = shotPressed ? 'rgb(255,255,255)' : 'rgb(0,0,0)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    // ctx.clip();
    // ctx.font = "16px sans-serif";
    // ctx.fillStyle = 'rgb(255,255,255)';
    // ctx.fillText("1", x - 5, y + 5);
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(x + playerPhysics.radius + 10, y);
    ctx.strokeStyle = 'rgb(255,255,255)';
    ctx.globalAlpha = 0.3;
    ctx.arc(x, y, playerPhysics.radius + 10, 0, Math.PI*2, true);
    ctx.stroke();
    ctx.closePath();
}

function segment_arc(st, segment) {
    var seg = segment_points(st, segment);
    var arc = data(segment, 'arc');
    if (arc && arc.a[0] == seg.a[0] && arc.a[1] == seg.a[1] &&
       arc.b[0] == seg.b[0] && arc.b[1] == seg.b[1] && arc.curve == segment.curve) {
        return arc;
    }
    arc = {a: seg.a, b: seg.b, curve: segment.curve};
    var curve = segment.curve;
    $.extend(arc, calculate_arc(seg.a, seg.b, curve));
    data(segment, 'arc', arc);
    return arc;
}

function calculate_arc(a, b, curve) {
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
        arc.radius = nc/2;
        arc.center = d;
        arc.from = angle_to(d, a);
        arc.to = angle_to(d, b);
        return arc;
    }

    // |a-b| / sin A = r / sin (90 - A/2)
    var angle = curve * Math.PI / 180;
    var spa2 = Math.sin(Math.PI/2 - angle/2);
    var radius = Math.abs(nc * spa2 / Math.sin(angle));
    
    
    var cp = normalise([c[1], -c[0]]);

    var l = Math.sqrt((nc*nc/4) + radius*radius - nc*radius*Math.cos(Math.PI/2 - angle/2));

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

function angle_to(o, p) {
    return Math.atan2(p[1]-o[1], p[0]-o[0]);
}

function Shape(type, object, i) {
    return {type: type, object: object, index: i};
}

function segment_points(st, segment) {
    var a = st.vertexes[segment.v0];
    var b = st.vertexes[segment.v1];
    return {
        a: [a.x, a.y],
        b: [b.x, b.y]
    };
}

function color_to_style(color, def) {
    if (!color) {
        return def ? def : 'rgb(0,0,0)';
    }else if (color.substr) {
        return '#' + color;
    }else{
        return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
    }
}

function norm(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function dist(a, b) {
    return norm([a[0]-b[0], a[1]-b[1]]);
}

function normalise(v) {
    var k = norm(v);
    var x = v[0] / (k || 1);
    var y = v[1] / (k || 1);
    return [x,y];
}

function data(obj, k, v) {
    if (v === undefined) {
        return obj._data ? obj._data[k] : undefined;
    }
    if (!obj._data) obj._data = {};
    obj._data[k] = v;
}

function complete(st, o) {
    if (o.trait) {
        return $.extend({}, st.traits[o.trait], o);
    }
    return $.extend({}, o);
}

function render(st) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas_rect[2] - canvas_rect[0], canvas_rect[3] - canvas_rect[1]);
    ctx.translate(-canvas_rect[0], -canvas_rect[1]);
    ctx.scale(window.devicePixelRatio * zoom, window.devicePixelRatio * zoom);

    renderbg(st, ctx);

    $.each(st.segments, function(i, segment) {
        segment = complete(st, segment);
        render_segment_arc(ctx, segment, segment_arc(st, segment));
    });

    $.each(st.discs, function(i, disc) {
        disc = complete(st, disc);
        ctx.beginPath();
        var radius = disc.radius !== undefined ? disc.radius : haxball.default_disc_radius;
        ctx.arc(disc.pos[0], disc.pos[1], radius, 0, Math.PI * 2, true);
        ctx.strokeStyle = 'rgb(0,0,0)';
        ctx.lineWidth = 2;
        ctx.fillStyle = color_to_style(disc.color, haxball.disc_color);
        ctx.fill();
        ctx.stroke();
    });

    // draw puck
    ctx.beginPath();
    ctx.arc(0, 0, ballPhysics.radius, 0, Math.PI*2, true);
    ctx.fillStyle = color_to_style(ballPhysics.color);
    ctx.strokeStyle = 'rgb(0,0,0)';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

}

function render_segment_arc(ctx, segment, arc) {
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

function renderbg(st, ctx) {
    var bg = st.bg;
    ctx.save();

    if (bg.type == 'grass' || bg.type == 'hockey') {

        ctx.fillStyle = haxball[bg.type].bg_color;
        ctx.fillRect(-st.width, -st.height, 2 * st.width, 2 * st.height);

        ctx.beginPath();
        
        ctx.moveTo(-bg.width + bg.cornerRadius, -bg.height);
        // TODO: this border doesn't render well in iceweasel
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
        ctx.arc(0, 0, bg.kickOffRadius, 0, Math.PI*2, true);

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

function for_all_shapes(st, types, f) {
    if (!f) {
        f = types;
        types = ['vertexes', 'segments', 'goals', 'discs', 'planes'];
    }

    $.each(types, function(i, name) {
        var group = st[name];
        if (group) {
            $.each(group, function(i, obj) {
                return f(Shape(name, obj, i));
            });
        }
    });
}

function resize_canvas() {
    // TODO: use scrollLeft and scrollTop to recenter the view
    var st = stadium;

    

    var rect;

    rect = [-st.width, -st.height, st.width, st.height];

    var consider = function(pt, r) {
        var x = pt[0];
        var y = pt[1];
        if (x - r < rect[0]) rect[0] = x - r;
        if (y - r < rect[1]) rect[1] = y - r;
        if (x + r > rect[2]) rect[2] = x + r;
        if (y + r > rect[3]) rect[3] = y + r;
    };

    for_all_shapes(stadium, function(shape) {
        var obj = shape.object;
        var o = complete(st, obj);
        switch(shape.type) {
        case 'vertexes':
            consider([o.x, o.y], 0);
            break;
        case 'goals':
            consider(o.p0, 0);
            consider(o.p1, 0);
            break;
        case 'discs':
            consider(o.pos, o.radius);
            break;
        }
    });

    var cd = $('#canvas_div');
    var canvas_div_size = [cd.innerWidth(), cd.innerHeight()];
    
    rect = [
        Math.round(Math.min(rect[0] - margin, -canvas_div_size[0]/2)),
        Math.round(Math.min(rect[1] - margin, -canvas_div_size[1]/2)),
        Math.round(Math.max(rect[2] + margin, canvas_div_size[0]/2)),
        Math.round(Math.max(rect[3] + margin, canvas_div_size[1]/2))
    ];

    canvas_rect = rect;
    // var wh = { width: rect[2] - rect[0], height: rect[3] - rect[1] };
    var wh = { width: canvas.getBoundingClientRect().width, height: canvas.getBoundingClientRect().height };

    $(canvas).attr(wh);
    $(canvas).css(wh);

    render(stadium);
}

var interval = setInterval(draw, 1000 / frameRate);
