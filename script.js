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
    default_disc_radius: 10
};

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

var x = -stadium.width + stadium.spawnDistance;
var y = 0;
var xspeed = 0;
var yspeed = 0;

var ballRadius = 10;
var playerRadius = 15;
var playerDamping = 0.96;
var playerAcceleration = 0.1;

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
    
    if (rightPressed && x < stadium.width - playerRadius) {
        direction[0] = 1;
    }
    if (leftPressed && x > -stadium.width + playerRadius) {
        direction[0] = -1;
    }
    if (downPressed && y < stadium.height - playerRadius) {
        direction[1] = 1;
    }
    if (upPressed && y > -stadium.height + playerRadius) {
        direction[1] = -1;
    }

    if (norm(direction) !== 0) {
        direction[0] /= norm(direction);
        direction[1] /= norm(direction);
    }

    xspeed = xspeed + direction[0] * playerAcceleration;
    yspeed = yspeed + direction[1] * playerAcceleration;
    xspeed *= playerDamping;
    yspeed *= playerDamping;
    x += xspeed;
    y += yspeed;
    
    if (x > stadium.width - playerRadius) {
        x = stadium.width - playerRadius;
        xspeed = 0;
    }
    if (x < -stadium.width + playerRadius) {
        x = -stadium.width + playerRadius;
        xspeed = 0;
    }
    if (y > stadium.height - playerRadius) {
        y = stadium.height - playerRadius;
        yspeed = 0;
    }
    if (y < -stadium.height + playerRadius) {
        y = -stadium.height + playerRadius;
        yspeed = 0;
    }
    
    // draw red
    ctx.beginPath();
    ctx.arc(x, y, playerRadius, 0, Math.PI*2, true);
    ctx.fillStyle = 'rgb(229,110,86)';
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
    ctx.moveTo(x + playerRadius + 10, y);
    ctx.strokeStyle = 'rgb(255,255,255)';
    ctx.globalAlpha = 0.3;
    ctx.arc(x, y, playerRadius + 10, 0, Math.PI*2, true);
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

function between(a, b, c) {
    return (a <= c && c <= b) || (b <= c && c <= a);
}

function height_line_point(a, b, p) {
    var d = dist(a, b);
    if (d === 0)
        return dist(a, p);
    return ((b[0]-a[0]) * (a[1]-p[1]) - (a[0]-p[0]) * (b[1]-a[1])) / d;
}

function distance_circle_point(c, r, p) {
    return Math.abs(dist(c, p) - r);
}

function Shape(type, object, i) {
    return {type: type, object: object, index: i};
}

function three_point_angle(a, o, b) {
    var r = angle_to(o, a);
    var s = angle_to(o, b);
    var d = Math.abs(r - s);
    if (d > Math.PI)
        return Math.PI * 2 - d;
    return d;
}

function circumcenter(a, b, c) {
    // http://en.wikipedia.org/wiki/Circumscribed_circle

    var d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));

    if (d === 0)
        return false;
    
    return [
        ((a[1] * a[1] + a[0] * a[0]) * (b[1] - c[1]) +
         (b[1] * b[1] + b[0] * b[0]) * (c[1] - a[1]) +
         (c[1] * c[1] + c[0] * c[0]) * (a[1] - b[1])) / d,
        ((a[1] * a[1] + a[0] * a[0]) * (c[0] - b[0]) +
         (b[1] * b[1] + b[0] * b[0]) * (a[0] - c[0]) +
         (c[1] * c[1] + c[0] * c[0]) * (b[0] - a[0])) / d
    ];
}

function segment_arc_to_point(st, segment, pt) {
    var s = complete(st, segment);
    var arc = segment_arc(st, segment);
    var o = circumcenter(pt, arc.a, arc.b);
    var new_arc = { a: arc.a, b: arc.b };
    
    if (!o) {
        new_arc.curve = 0;
        return new_arc;
    }

    var a = arc.a;
    var b = arc.b;
    var height = height_line_point(a, b, pt);

    new_arc.curve = curve_from_center(o, a, b, height);

    if (Math.abs(new_arc.curve) > maximum_curve) {
        new_arc.curve = sign(new_arc.curve) * maximum_curve;
        $.extend(new_arc, calculate_arc(arc.a, arc.b, new_arc.curve));
        return new_arc;
    }

    
    new_arc.center = o;
    new_arc.radius = dist(o, pt);
    new_arc.from = angle_to(o, a);
    new_arc.to = angle_to(o, b);

    if (new_arc.curve < 0) {
        var c = new_arc.from;
        new_arc.from = new_arc.to;
        new_arc.to = c;
    }

    return new_arc;
}

function curve_from_center(o, a, b, height) {
    var angle = three_point_angle(a, o, b);

    var o_side = height_line_point(a, b, o) < 0;

    if (height < 0) {
        if (o_side)
            angle = Math.PI*2 - angle;
        angle = -angle;
    }
    else if (!o_side) {
        angle = Math.PI*2 - angle;
    }

    return angle / Math.PI * 180;
}

function curve_segment_to_point(st, segment, pt) {
    var arc = segment_arc_to_point(st, segment, pt);

    segment.curve = arc.curve;

    if (mirror_mode) {
        $.each(mirror_data(segment), function(dir, shape) {
            if (dir == 'horizontal' || dir == 'vertical')
                shape.object.curve = -arc.curve;
            else
                shape.object.curve = arc.curve;
        });
    }
}

function equal(a, b) {
    // TODO: other types. atm this is just used to compare numbers, strings and arrays
    if (a instanceof Array) {
        return (b instanceof Array) && list_equal(a,b);
    }else{
        return a == b;
    }
}

function list_equal(a, b) {
    if (a.length != b.length)
        return false;
    for(var i = 0; i < a.length; i++) {
        if (!equal(a[i], b[i]))
            return false;
    }
    return true;
}

function plane_extremes(st, plane) {
    var ext = data(plane, 'extremes');

    // TODO: complete the plane object

    if (ext && ext.normal[0] == plane.normal[0] && ext.normal[1] == plane.normal[1] && ext.dist == plane.dist &&
       list_equal(canvas_rect, ext.canvas_rect)) {
        return ext;
    }
    ext = {normal: [plane.normal[0], plane.normal[1]], dist: plane.dist, canvas_rect: canvas_rect };

    var pts = plane_extremes_helper(st, ext.normal, ext.dist);

    ext.a = pts.a;
    ext.b = pts.b;

    data(plane, 'extremes', ext);
    return ext;
}

function plane_extremes_helper(st, normal, dist) {
    var ext = {};
    
    dist = - dist;
    
    // ax + by = p

    if (normal[0] === 0 && normal[1] === 0) {
        normal = [1, 0];
    }

    var n = normalise(normal);
    
    var r = canvas_rect;

    var p1 = [r[0], (-dist - n[0] * r[0]) / n[1]];
    var p2 = [r[2], (-dist - n[0] * r[2]) / n[1]];
    var p3 = [(-dist - n[1] * r[1]) / n[0], r[1]];
    var p4 = [(-dist - n[1] * r[3]) / n[0], r[3]];
    
    if (n[0] === 0) {
        ext.a = p1;
        ext.b = p2;
    }else if (n[1] === 0) {
        ext.a = p3;
        ext.b = p4;
    }else{
        var keep = [];
        if (between(r[1], r[3], p1[1])) keep.push(p1);
        if (between(r[1], r[3], p2[1])) keep.push(p2);
        if (between(r[0], r[2], p3[0])) keep.push(p3);
        if (between(r[0], r[2], p4[0])) keep.push(p4);
        if (keep.length != 2) {
            ext.a = p1;
            ext.b = p3;
            if (p1 == p3)
                ext.b = p4;
        }else{
            ext.a = keep[0];
            ext.b = keep[1];
        }
    }

    return ext;
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
    
    var x = v[0] / k;
    var y = v[1] / k;
    
    return [x,y];
}

function data(obj, k, v) {
    if (v === undefined) {
        return obj._data ? obj._data[k] : undefined;
    }
    if (!obj._data)
        obj._data = {};
    obj._data[k] = v;
}

function complete(st, o) {
    if (o.trait) {
        return $.extend({}, st.traits[o.trait], o);
    }
    return $.extend({}, o);
}

function render(st) {
    var transform = function(shape, draw) { draw(); };
    var ctx = canvas.getContext('2d');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas_rect[2] - canvas_rect[0], canvas_rect[3] - canvas_rect[1]);
    ctx.translate(-canvas_rect[0], -canvas_rect[1]);

    renderbg(st, ctx);

    $.each(st.segments, function(i, segment) {
        transform(Shape('segments', segment, i), function() {
            segment = complete(st, segment);
            render_segment_arc(ctx, segment, segment_arc(st, segment));
        });
    });

    $.each(st.discs, function(i, disc) {
        transform(Shape('discs', disc, i), function() {
            disc = complete(st, disc);
            ctx.beginPath();
            var radius = disc.radius !== undefined ? disc.radius : haxball.default_disc_radius;
            ctx.arc(disc.pos[0], disc.pos[1], radius, 0, Math.PI*2, true);
            ctx.strokeStyle = 'rgb(0,0,0)';
            ctx.lineWidth = 2;
            ctx.fillStyle = color_to_style(disc.color, haxball.disc_color);
            ctx.fill();
            ctx.stroke();
        });
    });

    // draw puck
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI*2, true);
    ctx.fillStyle = 'rgb(255,255,255)';
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
        ctx.translate(40,40);
        ctx.fillStyle = bg_patterns[bg.type];
        ctx.fillRect(-st.width - 40, -st.height - 40, 2 * st.width - 40, 2 * st.height - 40);
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
        case 'planes':
            // TODO: find a better way to ensure that a plane is reachable
            var ext = plane_extremes(st, obj);
            consider(midpoint(ext.a, ext.b), 0);
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
    var wh = { width: rect[2] - rect[0], height: rect[3] - rect[1] };
    $(canvas).attr(wh);
    $(canvas).css(wh);

    render(stadium);
}

function midpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

var interval = setInterval(draw, 1000 / frameRate);
