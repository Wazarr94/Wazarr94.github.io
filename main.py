import math
import json
import sys
import copy
import haxballPackage.classObject as objectsHaxball
import haxballPackage.functions as functionsHaxball

Input = {'LEFT': 2, 'RIGHT': 8, 'UP': 1, 'DOWN': 4, 'SHOOT': 16}
scorableDiscsId = [0 for i in range(256)]
scorableDiscsPos = [[0, 0] for i in range(256)]
currentFrame = [-1]


haxball = objectsHaxball.Haxball()
stadium = json.loads('{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')
stadiumP = json.loads('{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1},{"bCoef":1,"dist":0,"normal":[-0.5,0.5]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')
stadium2 = json.loads('{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')

stadium_copy = json.loads(json.dumps(stadium))


discs = []
for d in stadium_copy["discs"]:
    discs.append(objectsHaxball.Disc(d))

for d in discs:
    if (hasattr(d, 'trait')):
        for key, value in stadium["traits"][d.trait].items():
            if (key not in d.__dict__.keys()):
                setattr(d, key, value)
    for (key, value) in haxball.discPhysics.items():
        if (key not in d.__dict__.keys()):
            setattr(d, key, value)
    d = functionsHaxball.collisionTransformation(d, haxball)

if (stadium_copy.get("ballPhysics") == None):
    ballPhysics = objectsHaxball.ballPhysics(haxball)
else:
    ballPhysics = ballPhysics(stadium_copy["ballPhysics"])

for key, value in haxball.ballPhysics.items():
    if (hasattr(ballPhysics, key)):
        setattr(ballPhysics, key, value)

discs.insert(0, (functionsHaxball.collisionTransformation(ballPhysics, haxball)))
stadium_copy["discs"] = discs

vertexes = []
for v in stadium_copy["vertexes"]:
    vertexes.append(objectsHaxball.Vertex(v))

for v in vertexes:
    if (hasattr(v, 'trait')):
        for key, value in stadium["traits"][v.trait].items():
            if (key not in v.__dict__.keys()):
                setattr(v, key, value)
    for key, value in haxball.vertexPhysics.items():
        if (key not in v.__dict__.keys()):
            setattr(v, key, value)
    v = functionsHaxball.collisionTransformation(v, haxball)
stadium_copy["vertexes"] = vertexes

segments = []
for s in stadium_copy["segments"]:
    segments.append(objectsHaxball.Segment(s))

for s in segments:
    if (hasattr(s, 'trait')):
        for key, value in stadium["traits"][s.trait].items():
            if (key not in s.__dict__.keys()):
                setattr(s, key, value)
    for key, value in haxball.segmentPhysics.items():
            if (key not in s.__dict__.keys()):
                setattr(s, key, value)
    s = functionsHaxball.collisionTransformation(s, haxball, vertexes)
    s = functionsHaxball.getCurveFSegment(s)
    s = functionsHaxball.getStuffSegment(s)
stadium_copy["segments"] = segments

planes = []
for p in stadium_copy["planes"]:
    planes.append(objectsHaxball.Plane(p))

for p in planes:
    if (hasattr(p, 'trait')):
        for key, value in stadium["traits"][p.trait].items():
            if (key not in p.__dict__.keys()):
                setattr(p, key, value)
    for key, value in haxball.planePhysics.items():
        if (key not in p.__dict__.keys()):
            setattr(p, key, value)

    p = functionsHaxball.collisionTransformation(p, haxball)
stadium_copy["planes"] = planes

goals = []
for g in stadium_copy["goals"]:
    goals.append(objectsHaxball.Goal(g))

for g in goals:
    if (g.team == "red"):
        g.team = haxball.Team["RED"]
    else:
        g.team = haxball.Team["BLUE"]
stadium_copy["goals"] = goals


stadium["discs"] = [copy.deepcopy(d) for d in discs]
stadium["vertexes"] = [copy.deepcopy(v) for v in vertexes]
stadium["segments"] = [copy.deepcopy(s) for s in segments]
stadium["planes"] = [copy.deepcopy(p) for p in planes]
stadium["goals"] = [copy.deepcopy(g) for g in goals]


game = objectsHaxball.Game(haxball)

a = objectsHaxball.Player(haxball, "BOT1", "1", haxball.Team["RED"], 
           [[], [], [], [], []], functionsHaxball.resolveBotInputs1)
functionsHaxball.setPlayerDefaultProperties(a, haxball, discs, stadium)
b = objectsHaxball.Player(haxball, "BOT2", "1", haxball.Team["BLUE"],
           [[], [], [], [], []], functionsHaxball.resolveBotInputs2)
functionsHaxball.setPlayerDefaultProperties(b, haxball, discs, stadium)
playersArray = [a, b]

inputArrayCurr = [[[p.name, p.avatar, p.team["id"]], []] for p in playersArray]

functionsHaxball.resetPositionDiscs(haxball, discs, stadium, playersArray, game)

arrayRec = None
while arrayRec == None:
    arrayRec = functionsHaxball.draw(currentFrame, discs, playersArray, inputArrayCurr, planes, segments, vertexes, game, haxball, scorableDiscsId, scorableDiscsPos, Input, stadium)

with open("rec_py.hbr", 'w') as f:
    json_rec = json.dumps(arrayRec, separators=(',', ':'))
    f.write(json_rec)