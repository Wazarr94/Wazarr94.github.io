import math
import json
import sys
import copy
import numpy as np

Input = {'LEFT': 2, 'RIGHT': 8, 'UP': 1, 'DOWN': 4, 'SHOOT': 16}
scorableDiscsId = [0 for i in range(256)]
scorableDiscsPos = [[0, 0] for i in range(256)]
currentFrame = -1
discProperties = [['acceleration', 1], ['bCoef', 1],
                  ['cGroup', 1], ['cMask', 1], ['damping', 1], ['invMass', 1],
                  ['kickStrength', 1], ['kickingAcceleration', 1], ['kickingDamping', 1],
                  ['radius', 1], ['x', 1], ['xspeed', 1], ['y', 1], ['yspeed', 1]]
vertexProperties = [['bCoef', 1], ['cGroup', 1], ['cMask', 1], ['x', 1], ['y', 1]]
segmentProperties = [['bCoef', 1], ['cGroup', 1], ['cMask', 1], ['circleCenter', 2],
                     ['circleRadius', 1], ['curve', 1], ['curveF', 1], ['normal', 2], ['v0', 2], ['v0Tan', 2], ['v1', 2], ['v1Tan', 2]]
planeProperties = [['bCoef', 1], ['cGroup', 1],
                   ['cMask', 1], ['dist', 1], ['normal', 2]]
goalProperties = [['p0', 2], ['p1', 2], ['team', 1]]



class Disc:
    def __init__(self, disc):
        if (disc.get("radius") != None):
            self.radius = disc["radius"]

        if (disc.get("bCoef") != None):
            self.bCoef = disc["bCoef"]

        if (disc.get("invMass") != None):
            self.invMass = disc["invMass"]

        if (disc.get("damping") != None):
            self.damping = disc["damping"]

        self.x = disc["pos"][0]
        self.y = disc["pos"][1]

        if (disc.get("speed") != None):
            self.xspeed = disc["speed"][0]
            self.yspeed = disc["speed"][1]

        if (disc.get("cGroup") != None):
            self.cGroup = disc["cGroup"]

        if (disc.get("cMask") != None):
            self.cMask = disc["cMask"]

        if (disc.get("trait") != None):
            self.trait = disc["trait"]


class ballPhysics(Disc):
	def __init__(self):
		super().__init__(haxball.ballPhysics)


class playerPhysics(Disc):
    def __init__(self):
        super().__init__(haxball.playerPhysics)
        self.acceleration = 0.1
        self.kickingAcceleration = 0.07
        self.kickingDamping = 0.96
        self.kickStrength = 5


class Game:
    def __init__(self):
        self.state = 0
        self.start = True
        self.timeout = 0
        self.timeLimit = 3
        self.scoreLimit = 3
        self.kickoffReset = 8
        self.red = 0
        self.blue = 0
        self.time = 0
        self.teamGoal = haxball.Team["SPECTATORS"]


class Player:
    def __init__(self, name=None, avatar=None, team=None, controls=None, bot=None):
        if (name != None):
            self.name = name
        else:
            self.name = "Player"

        if (team != None):
             self.team = team
        else:
            self.team = haxball.Team["SPECTATORS"]

        if (avatar != None):
            self.avatar = avatar
        else:
            self.avatar = ''

        if (controls != None):
             self.controls = controls
        else:
            self.controls = [["ArrowUp"], ["ArrowLeft"], ["ArrowDown"], ["ArrowRight"], ["KeyX"]]

        if (bot != None):
            self.bot = bot

        self.disc = None
        self.inputs = 0
        self.shooting = False
        self.shotReset = False
        self.spawnPoint = 0


class Vertex:
    def __init__(self, vertex):
        self.x = vertex["x"]
        self.y = vertex["y"]

        if (vertex.get("trait") != None):
            self.trait = vertex["trait"]

        if (vertex.get("bCoef") != None):
            self.bCoef = vertex["bCoef"]

        if (vertex.get("cMask") != None):
            self.cMask = vertex["cMask"]

        if (vertex.get("cGroup") != None):
            self.cGroup = vertex["cGroup"]


class Segment:
    def __init__(self, segment):
        self.v0 = segment['v0']
        self.v1 = segment['v1']

        if (segment.get("trait") != None):
            self.trait = segment["trait"]

        if (segment.get("bCoef") != None):
            self.bCoef = segment["bCoef"]

        if (segment.get("cMask") != None):
            self.cMask = segment["cMask"]

        if (segment.get("cGroup") != None):
            self.cGroup = segment["cGroup"]

        if (segment.get("curve") != None):
            self.curve = segment["curve"]


class Plane:
    def __init__(self, plane):
        self.normal = plane["normal"]
        self.dist = plane["dist"]

        if (plane.get("trait") != None):
            self.trait = plane["trait"]

        if (plane.get("bCoef") != None):
            self.bCoef = plane["bCoef"]

        if (plane.get("cMask") != None):
            self.cMask = plane["cMask"]

        if (plane.get("cGroup") != None):
            self.cGroup = plane["cGroup"]


class Goal:
    def __init__(self, goal):
        self.p0 = goal["p0"]
        self.p1 = goal["p1"]
        self.team = goal["team"]

        if (goal.get("trait") != None):
            self.trait = goal["trait"]


class Haxball:
    def __init__(self):
        self.Team = {
            "RED": {
                "name": "t-red",
                "id": 1,
                "color": 'rgb(229, 110, 86)',
                "cGroup": 2
            },
            "BLUE": {
                "name": "t-blue",
                "id": 2,
                "color": 'rgb(86,137,229)',
                "cGroup": 4
            },
            "SPECTATORS": {
                "name": "t-spectators",
                "id": 0,
                "color": None,
                "cGroup": 0
            },
        }
        self.playerPhysics = {
            "radius": 15,
            "bCoef": 0.5,
            "invMass": 0.5,
            "damping": 0.96,
            "acceleration": 0.1,
            "kickingAcceleration": 0.07,
            "kickingDamping": 0.96,
            "kickStrength": 5,
            "pos": [0, 0],
            "speed": [0, 0],
            "cMask": ["all"],
            "cGroup": [""]
        }
        self.ballPhysics = {
            "radius": 10,
            "bCoef": 0.5,
            "invMass": 1,
            "damping": 0.99,
            "color": "FFFFFF",
            "pos": [0, 0],
            "speed": [0, 0],
            "cMask": ["all"],
            "cGroup": ["ball"]
        }
        self.discPhysics = {
            "radius": 10,
            "bCoef": 0.5,
            "invMass": 0,
            "damping": 0.99,
            "speed": [0, 0],
            "color": 'rgb(255,255,255)',
            "cMask": ["all"],
            "cGroup": ["all"]
        }
        self.segmentPhysics = {
            "curve": 0,
            "bCoef": 1,
            "color": 'rgb(255,255,255)',
            "cGroup": ["wall"],
            "cMask": ["all"]
        }
        self.planePhysics = {
            "bCoef": 1,
            "cGroup": ["wall"],
            "cMask": ["all"]
        }
        self.vertexPhysics = {
            "bCoef": 1,
            "cGroup": ["wall"],
            "cMask": ["all"]
        }
        self.collisionFlags = {
            "": 0,
            "ball": 1,
            "red": 2,
            "blue": 4,
            "redKO": 8,
            "blueKO": 16,
            "wall": 32,
            "all": 63,
            "kick": 64,
            "score": 128,
            "c0": 268435456,
            "c1": 536870912,
            "c2": 1073741824,
            "c3": -2147483648
        }


haxball = Haxball()
stadium = json.loads('{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')
stadiumP = json.loads('{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1},{"bCoef":1,"dist":0,"normal":[-0.5,0.5]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')
stadium2 = json.loads('{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')

stadium_copy = json.loads(json.dumps(stadium))


def checkKick(player):
    if (player.shotReset):
        return not(player.shooting)
    return player.shooting


def getInputs(a, b, c, d, e):
    return (a + b * 2 + c * 4 + d * 8 + e * 16)


def setDiscDefaultProperties(currentDisc, defaultDisc):
    currentDisc.x = defaultDisc.x
    currentDisc.y = defaultDisc.y
    currentDisc.xspeed = defaultDisc.xspeed
    currentDisc.yspeed = defaultDisc.yspeed
    currentDisc.radius = defaultDisc.radius
    currentDisc.bCoef = defaultDisc.bCoef
    currentDisc.invMass = defaultDisc.invMass
    currentDisc.damping = defaultDisc.damping
    currentDisc.cGroup = defaultDisc.cGroup
    currentDisc.cMask = defaultDisc.cMask


def setPlayerDefaultProperties(player):
    if (player.team == haxball.Team["SPECTATORS"]):
        player.disc = None
    else:
        player.inputs = 0
        if (player.disc == None):
            b = playerPhysics()
            player.disc = b
            discs.append(b)

        c = collisionTransformation(Disc(haxball.playerPhysics))
        player.disc.radius = c.radius
        player.disc.invMass = c.invMass
        player.disc.damping = c.damping
        player.disc.bCoef = c.bCoef
        if (player.team == haxball.Team["RED"]):
            player.disc.cMask = 39 + haxball.collisionFlags["redKO"]
        else:
            player.disc.cMask = 39 + haxball.collisionFlags["blueKO"]
        player.disc.cGroup = player.team["cGroup"] | c.cGroup
        player.disc.x = (2 * player.team["id"] - 3) * stadium["width"]
        player.disc.y = 0
        player.disc.xspeed = 0
        player.disc.yspeed = 0


def resetPositionDiscs():
    game.state = 0
    setDiscDefaultProperties(discs[0], stadium['discs'][0])
    teamArray = [0, 0, 0]
    for i in range(len(playersArray)):
        player = playersArray[i]
        setPlayerDefaultProperties(player)
        teamP = player.team
        if (teamP != haxball.Team["SPECTATORS"]):
            valueArr = teamArray[teamP['id']]
            fact = valueArr + 1 >> 1
            if ((valueArr % 2) == 1):
                fact = -fact
            pos_x = stadium['spawnDistance'] * (2 * teamP['id'] - 3)
            pos_y = 55 * fact
            player.disc.x = pos_x
            player.disc.y = pos_y
            teamArray[teamP['id']] += 1

def collisionTransformation(physics, vertexes=None):
    cMask = physics.cMask
    y = 0
    if (type(cMask) is list):
        for x in cMask:
            y |= haxball.collisionFlags[x]
    physics.cMask = y

    cGroup = physics.cGroup
    y = 0
    if (type(cGroup) is list):
        for x in cGroup:
            y |= haxball.collisionFlags[x]

    physics.cGroup = y

    if (y == 1):
        physics.cGroup = 193

    if (hasattr(physics, 'v0') and vertexes != None):
        physics.v0 = [vertexes[physics.v0].x, vertexes[physics.v0].y]
        physics.v1 = [vertexes[physics.v1].x, vertexes[physics.v1].y]

    if (hasattr(physics, 'speed')):
        physics.xspeed = physics.speed[0]
        physics.yspeed = physics.speed[1]

    if (hasattr(physics, 'trait')):
        del physics.trait
    if (hasattr(physics, 'speed')):
        del physics.speed

    return physics


def getCurveFSegment(segment):
    a = segment.curve
    a *= .017453292519943295
    if (a < 0):
        a *= -1
        segment.curve *= -1
        b = segment.v0
        segment.v0 = segment.v1
        segment.v1 = b

    liminf = 0.17435839227423353
    limsup = 5.934119456780721
    if (a > liminf and a < limsup):
        segment.curveF = 1 / math.tan(a / 2)
    return segment


def getStuffSegment(segment):
    if (hasattr(segment, "curveF")):
        segV1 = {"x": segment.v1[0], "y": segment.v1[1]}
        segV0 = {"x": segment.v0[0], "y": segment.v0[1]}
        dist_x = 0.5 * (segV1["x"] - segV0["x"])
        dist_y = 0.5 * (segV1["y"] - segV0["y"])
        segment.circleCenter = [segV0["x"] + dist_x - dist_y * segment.curveF,
                                segV0["y"] + dist_y + dist_x * segment.curveF]
        dist_x_CC = segV0["x"] - segment.circleCenter[0]
        dist_y_CC = segV0["y"] - segment.circleCenter[1]
        segment.circleRadius = math.sqrt(dist_x_CC * dist_x_CC + dist_y_CC * dist_y_CC)
        segment.v0Tan = [-(segV0["y"] - segment.circleCenter[1]),
                         segV0["x"] - segment.circleCenter[0]]
        segment.v1Tan = [-(segment.circleCenter[1] - segV1["y"]),
                         segment.circleCenter[0] - segV1["x"]]
        if (segment.curveF <= 0):
            segment.v0Tan[0] *= -1
            segment.v0Tan[1] *= -1
            segment.v1Tan[0] *= -1
            segment.v1Tan[1] *= -1
    else:
        segV0 = {"x": segment.v0[0], "y": segment.v0[1]}
        segV1 = {"x": segment.v1[0], "y": segment.v1[1]}
        dist_x = segV0["x"] - segV1["x"]
        dist_y = -(segV0["y"] - segV1["y"])
        dist = math.sqrt(dist_x * dist_x + dist_y * dist_y)
        setattr(segment, 'normal', [dist_y / dist, dist_x / dist])
        return segment

def resolvePlayerMovement(player):
    if (player.disc != None):
        playerDisc = player.disc
        if ((player.inputs & Input["SHOOT"]) != 0):
            player.shooting = True
        else:
            player.shooting = False
            player.shotReset = False
        
        if (checkKick(player)):
            kickDone = False
            for d in discs:
                if ((d.cGroup & haxball.collisionFlags["kick"]) != 0 and d != playerDisc):
                    discPos = {"x": d.x, "y": d.y}
                    playerDiscPos = {"x": playerDisc.x, "y": playerDisc.y}
                    dist_x = discPos["x"] - playerDiscPos["x"]
                    dist_y = discPos["y"] - playerDiscPos["y"]
                    dist = math.sqrt(dist_x * dist_x + dist_y * dist_y)
                    if (dist - playerDisc.radius - d.radius < 4):
                        dist_x = dist_x / dist
                        dist_y = dist_y / dist
                        kickS = haxball.playerPhysics["kickStrength"]
                        d.xspeed = d.xspeed + dist_x * kickS
                        d.yspeed = d.yspeed + dist_y * kickS
                        kickDone = True

            if (kickDone):
                player.shotReset = True
                if (playerDisc.cMask != 39):
                    playerDisc.cMask = 39

        direction = [0, 0]
        if ((player.inputs & Input["UP"]) != 0):
            direction[1] -= 1
        if ((player.inputs & Input["LEFT"]) != 0):
            direction[0] -= 1
        if ((player.inputs & Input["DOWN"]) != 0):
            direction[1] += 1
        if ((player.inputs & Input["RIGHT"]) != 0):
            direction[0] += 1

        direction = normalise(direction)

        if (checkKick(player)):
            playerDisc.xspeed = playerDisc.xspeed + \
                direction[0] * playerDisc.kickingAcceleration
            playerDisc.yspeed = playerDisc.yspeed + \
                direction[1] * playerDisc.kickingAcceleration
        else:
            playerDisc.xspeed = playerDisc.xspeed + \
                direction[0] * playerDisc.acceleration
            playerDisc.yspeed = playerDisc.yspeed + \
                direction[1] * playerDisc.acceleration


def resolveDVCollision(disc, vertex):
    discPos = {"x": disc.x, "y": disc.y}
    vertexPos = {"x": vertex.x, "y": vertex.y}
    dist_x = discPos["x"] - vertexPos["x"]
    dist_y = discPos["y"] - vertexPos["y"]
    dist = dist_x * dist_x + dist_y * dist_y
    if (dist > 0 and dist <= disc.radius ** 2):
        dist = math.sqrt(dist)
        dist_x = dist_x / dist
        dist_y = dist_y / dist
        disc.x = disc.x + dist_x * (disc.radius - dist)
        disc.y = disc.y + dist_y * (disc.radius - dist)
        discSpeed = {"x": disc.xspeed, "y": disc.yspeed}
        speedCoef = dist_x * discSpeed["x"] + dist_y * discSpeed["y"]
        if (speedCoef < 0):
            speedCoef *= disc.bCoef * vertex.bCoef + 1
            disc.xspeed = disc.xspeed - dist_x * speedCoef
            disc.yspeed = disc.yspeed - dist_y * speedCoef


def resolveDSCollision(disc, segment):
    distance = None
    coef_x = None
    coef_y = None
    if (not hasattr(segment, 'curveF')):
        v0Pos = {"x": segment.v0[0], "y": segment.v0[1]}
        v1Pos = {"x": segment.v1[0], "y": segment.v1[1]}
        seg_x = v1Pos["x"] - v0Pos["x"]
        seg_y = v1Pos["y"] - v0Pos["y"]
        discPos = {"x": disc.x, "y": disc.y}
        dist0_x = discPos["x"] - v0Pos["x"]
        dist0_y = discPos["y"] - v0Pos["y"]
        dist1_x = discPos["x"] - v1Pos["x"]
        dist1_y = discPos["y"] - v1Pos["y"]
        g = {"x": disc.x, "y": disc.y}
        if (dist0_x * seg_x + dist0_y * seg_y <= 0 or dist1_x * seg_x + dist1_y * seg_y >= 0):
            return
        norm = normalise([segment.v0[1] - segment.v1[1],
                          segment.v1[0] - segment.v0[0]])
        norm = {"x": -norm[0], "y": -norm[1]}
        coef_x = norm["x"]
        coef_y = norm["y"]
        distance = coef_x * dist1_x + coef_y * dist1_y
    else:
        circleC = segment.circleCenter
        discPos = {"x": disc.x, "y": disc.y}
        dist_x = discPos["x"] - circleC[0]
        dist_y = discPos["y"] - circleC[1]
        tan1 = segment.v1Tan
        tan0 = segment.v0Tan
        if ((tan1[0] * dist_x + tan1[1] * dist_y > 0 and tan0[0] * dist_x + tan0[1] * dist_y > 0) == (segment.curveF <= 0)):
            return
        dist = math.sqrt(dist_x * dist_x + dist_y * dist_y)
        if (dist == 0):
            return
        distance = dist - segment.circleRadius
        coef_x = dist_x / dist
        coef_y = dist_y / dist

    if (distance < 0):
        distance = -distance
        coef_x = -coef_x
        coef_y = -coef_y

    if (distance < disc.radius):
        distance = disc.radius - distance
        disc.x = disc.x + coef_x * distance
        disc.y = disc.y + coef_y * distance
        discSpeed = {"x": disc.xspeed, "y": disc.yspeed}
        speedCoef = coef_x * discSpeed["x"] + coef_y * discSpeed["y"]
        if (speedCoef < 0):
            speedCoef *= disc.bCoef * segment.bCoef + 1
            disc.xspeed = disc.xspeed - coef_x * speedCoef
            disc.yspeed = disc.yspeed - coef_y * speedCoef


def resolveDPCollision(disc, plane):
    norm = normalise(plane.normal)
    norm = {"x": norm[0], "y": norm[1]}
    discPos = {"x": disc.x, "y": disc.y}
    dist = plane.dist - (norm["x"] * discPos["x"] +
                         norm["y"] * discPos["y"]) + disc.radius
    if (dist > 0):
        disc.x = disc.x + norm["x"] * dist
        disc.y = disc.y + norm["y"] * dist
        discSpeed = {"x": disc.xspeed, "y": disc.yspeed}
        speedCoef = norm["x"] * discSpeed["x"] + norm["y"] * discSpeed["y"]
        if (speedCoef < 0):
            speedCoef *= disc.bCoef * plane.bCoef + 1
            disc.xspeed = disc.xspeed - norm["x"] * speedCoef
            disc.yspeed = disc.yspeed - norm["y"] * speedCoef


def resolveDDCollision(disc1, disc2):
    disc1Pos = {"x": disc1.x, "y": disc1.y}
    disc2Pos = {"x": disc2.x, "y": disc2.y}
    dist_x = disc1Pos["x"] - disc2Pos["x"]
    dist_y = disc1Pos["y"] - disc2Pos["y"]
    sumRadius = disc1.radius + disc2.radius
    dist = dist_x ** 2 + dist_y ** 2
    if (dist > 0 and dist <= sumRadius ** 2):
        dist = math.sqrt(dist)
        coef_x = dist_x / dist
        coef_y = dist_y / dist
        massCoef = disc1.invMass / (disc1.invMass + disc2.invMass)
        distDiscs = sumRadius - dist
        disc1.x = disc1.x + coef_x * (distDiscs * massCoef)
        disc1.y = disc1.y + coef_y * (distDiscs * massCoef)
        distDiscs -= (distDiscs * massCoef)
        disc2.x = disc2.x - coef_x * distDiscs
        disc2.y = disc2.y - coef_y * distDiscs
        disc1Speed = {"x": disc1.xspeed, "y": disc1.yspeed}
        disc2Speed = {"x": disc2.xspeed, "y": disc2.yspeed}
        speedCoef = coef_x * \
            (disc1Speed["x"] - disc2Speed["x"]) + \
            coef_y * (disc1Speed["y"] - disc2Speed["y"])
        if (speedCoef < 0):
            speedCoef *= disc1.bCoef * disc2.bCoef + 1
            massCoef *= speedCoef
            disc1.xspeed = disc1.xspeed - coef_x * massCoef
            disc1.yspeed = disc1.yspeed - coef_y * massCoef
            massCoef = speedCoef - massCoef
            disc2.xspeed = disc2.xspeed + coef_x * massCoef
            disc2.yspeed = disc2.yspeed + coef_y * massCoef


def checkGoal(discPos, discPosPrev):
    for i in range(0, len(stadium["goals"])):
        check = None
        goal = stadium["goals"][i]
        point0 = goal.p0
        point1 = goal.p1
        dist_x = discPosPrev[0] - discPos[0]
        dist_y = discPosPrev[1] - discPos[1]
        if ((-(point0[1] - discPos[1]) * dist_x + (point0[0] - discPos[0]) * dist_y) * (-(point1[1] - discPos[1]) * dist_x + (point1[0] - discPos[0]) * dist_y) > 0):
            check = False
        else:
            goal_x = point1[0] - point0[0]
            goal_y = point1[1] - point0[1]
            if ((-(discPos[1] - point0[1]) * goal_x + (discPos[0] - point0[0]) * goal_y) * (-(discPosPrev[1] - point0[1]) * goal_x + (discPosPrev[0] - point0[0]) * goal_y) > 0):
                check = False
            else:
                check = True
        if (check):
            return goal.team
    return haxball.Team["SPECTATORS"]


def resolveBotInputs1(player, args={}):
    if (player.disc != None):
        ball = discs[0]
        threshold = 2
        inputPlayer = 0
        if (player.disc.x - ball.x > threshold):
            inputPlayer += Input["LEFT"]
        if (player.disc.x - ball.x < -threshold):
            inputPlayer += Input["RIGHT"]
        if (player.disc.y - ball.y > threshold):
            inputPlayer += Input["UP"]
        if (player.disc.y - ball.y < -threshold):
            inputPlayer += Input["DOWN"]
        if ((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2 <= (ball.radius + player.disc.radius + 0.1) ** 2):
            inputPlayer += Input["SHOOT"]
        player.inputs = inputPlayer
        return


def resolveBotInputs2(player, args={}):
    if (player.disc != None):
        global currentFrame
        ball = discs[0]
        threshold = 2
        inputPlayer = 0
        if (currentFrame % 10 == 0):
            inputPlayer += Input["UP"]
        if (player.disc.x - ball.x > threshold):
            inputPlayer += Input["LEFT"]
        if (player.disc.x - ball.x < -threshold):
            inputPlayer += Input["RIGHT"]
        if (player.disc.y - ball.y > threshold):
            inputPlayer += Input["UP"]
        if (player.disc.y - ball.y < -threshold):
            inputPlayer += Input["DOWN"]
        if ((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2 <= (ball.radius + player.disc.radius + 0.05) ** 2):
            inputPlayer += Input["SHOOT"]
        player.inputs = inputPlayer
        return


def playInputs(player, args={}):
    if (player.disc != None):
        player.inputs = args["inputArray"][currentFrame]
        return


def draw():
    global currentFrame
    currentFrame += 1
    scoreIndex = 0

    for i in range(len(discs)):
        disc = discs[i]
        if ((disc.cGroup & 128) != 0):
            scorableDiscsId[scoreIndex] = i
            scorableDiscsPos[scoreIndex][0] = disc.x
            scorableDiscsPos[scoreIndex][1] = disc.y
            scoreIndex += 1

    for i in range(len(playersArray)):
        p = playersArray[i]
        if p.team["id"] != 0:
            if p.bot: p.bot(p, {})
            resolvePlayerMovement(p)
            inputArrayCurr[i][1].append(p.inputs)

    for d in discs:
        d.x += d.xspeed
        d.y += d.yspeed
        d.xspeed *= d.damping
        d.yspeed *= d.damping

    for i in range(len(discs)):
        d_a = discs[i]
        for j in range(i + 1, len(discs)):
            d_b = discs[j]
            if (((d_a.cGroup & d_b.cMask) != 0) and ((d_a.cMask & d_b.cGroup) != 0)):
                resolveDDCollision(d_a, d_b)
        if (d_a.invMass != 0):
            for p in planes:
                if (((d_a.cGroup & p.cMask) != 0) and ((d_a.cMask & p.cGroup) != 0)):
                    resolveDPCollision(d_a, p)
            for s in segments:
                if (((d_a.cGroup & s.cMask) != 0) and ((d_a.cMask & s.cGroup) != 0)):
                    resolveDSCollision(d_a, s)
            for v in vertexes:
                if (((d_a.cGroup & v.cMask) != 0) and ((d_a.cMask & v.cGroup) != 0)):
                    resolveDVCollision(d_a, v)

    if (game.state == 0):  # "kickOffReset"
        for disc in discs:
            if disc.x != None:
                disc.cMask = 39 | game.kickoffReset
        ball = discs[0]
        if (ball.xspeed * ball.xspeed + ball.yspeed * ball.yspeed > 0):
            game.state = 1

    elif (game.state == 1):  # "gameInGoing"
        game.time += .016666666666666666
        for disc in discs:
            if disc.x != None:
                disc.cMask = 39
        scoreTeam = haxball.Team["SPECTATORS"]
        for i in range(scoreIndex):
            scoreTeam = checkGoal(
                [discs[scorableDiscsId[i]].x, discs[scorableDiscsId[i]].y], scorableDiscsPos[i])
            if (scoreTeam != haxball.Team["SPECTATORS"]):
                break
        if (scoreTeam != haxball.Team["SPECTATORS"]):
            game.state = 2
            game.timeout = 150
            game.teamGoal = scoreTeam
            game.kickoffReset = scoreTeam["id"] * 8
            if scoreTeam["id"] == haxball.Team["BLUE"]["id"]:
                game.red += 1
            else:
                game.blue += 1
        else:
            if (game.timeLimit > 0 and game.time >= 60 * game.timeLimit and game.red != game.blue):
                endAnimation()

    elif (game.state == 2):  # "goalScored"
        game.timeout -= 1
        if (game.timeout <= 0):
            if ((game.scoreLimit > 0 and (game.red >= game.scoreLimit or game.blue >= game.scoreLimit)) or game.timeLimit > 0 and game.time >= 60 * game.timeLimit and game.red != game.blue):
                endAnimation()
            else:
                resetPositionDiscs()

    elif (game.state == 3):  # "gameEnding"
        game.timeout -= 1
        if (game.timeout <= 0 and game.start):
            game.start = False
            return inputArrayCurr

    return None


def endAnimation():
    game.state = 3
    game.timeout = 300


def norm(v):
    return math.sqrt(v[0] * v[0] + v[1] * v[1])


def normalise(v):
    k = norm(v)
    x = v[0] / (k or 1)
    y = v[1] / (k or 1)
    return [x, y]


def getSizeProp(prop):
    return sum([arr[1] for arr in prop])

def transformObjectToList(obj, properties = []):
    objectProperties = [[np.nan for i in range(properties[j][1])] for j in range(len(properties))]
    if (obj != None):
        for i in range(len(properties)):
            if (hasattr(obj, properties[i][0])):
                objectProperties[i] = getattr(obj, properties[i][0])
                if (properties[i][0] == "team"):
                    objectProperties[i] = objectProperties[i]["id"]
    return objectProperties


def get_stadium_obs_space():
    generalList = [stadium_copy['height'], stadium_copy['spawnDistance'], stadium_copy['height']]
    discList = [[np.nan for i in range(getSizeProp(discProperties))] for j in range(256)]
    vertexList = [[np.nan for i in range(getSizeProp(vertexProperties))] for j in range(256)]
    segmentList = [[np.nan for i in range(getSizeProp(segmentProperties))] for j in range(256)]
    planeList = [[np.nan for i in range(getSizeProp(planeProperties))] for j in range(256)]
    goalList = [[np.nan for i in range(getSizeProp(goalProperties))] for j in range(256)]
    for i in range(len(discs)):
        discList[i] = list(np.hstack(transformObjectToList(discs[i], discProperties)))
    for i in range(len(vertexes)):
        vertexList[i] = list(np.hstack(transformObjectToList(vertexes[i], vertexProperties)))
    for i in range(len(segments)):
        segmentList[i] = list(np.hstack(transformObjectToList(segments[i], segmentProperties)))
    for i in range(len(planes)):
        planeList[i] = list(np.hstack(transformObjectToList(planes[i], planeProperties)))
    for i in range(len(goals)):
        goalList[i] = list(np.hstack(transformObjectToList(goals[i], goalProperties)))
    return list(np.hstack(generalList + discList + vertexList + segmentList + planeList + goalList))


def get_game_obs_space():
    return [game.blue, game.kickoffReset, game.red, game.scoreLimit, game.state, game.time, game.timeLimit]


def get_obs_space():
    return list(np.hstack(get_game_obs_space() + get_stadium_obs_space()))


discs = []
for d in stadium_copy["discs"]:
    discs.append(Disc(d))

for d in discs:
    if (hasattr(d, 'trait')):
        for key, value in stadium["traits"][d.trait].items():
            if (key not in d.__dict__.keys()):
                setattr(d, key, value)
    for (key, value) in haxball.discPhysics.items():
        if (key not in d.__dict__.keys()):
            setattr(d, key, value)
    d = collisionTransformation(d)

if (stadium_copy.get("ballPhysics") == None):
    ballPhysics = ballPhysics()
else:
    ballPhysics = ballPhysics(stadium_copy["ballPhysics"])

for key, value in haxball.ballPhysics.items():
    if (hasattr(ballPhysics, key)):
        setattr(ballPhysics, key, value)

discs.insert(0, (collisionTransformation(ballPhysics)))
stadium_copy["discs"] = discs

vertexes = []
for v in stadium_copy["vertexes"]:
    vertexes.append(Vertex(v))

for v in vertexes:
    if (hasattr(v, 'trait')):
        for key, value in stadium["traits"][v.trait].items():
            if (key not in v.__dict__.keys()):
                setattr(v, key, value)
    for key, value in haxball.vertexPhysics.items():
        if (key not in v.__dict__.keys()):
            setattr(v, key, value)
    v = collisionTransformation(v)
stadium_copy["vertexes"] = vertexes

segments = []
for s in stadium_copy["segments"]:
    segments.append(Segment(s))

for s in segments:
    if (hasattr(s, 'trait')):
        for key, value in stadium["traits"][s.trait].items():
            if (key not in s.__dict__.keys()):
                setattr(s, key, value)
    for key, value in haxball.segmentPhysics.items():
            if (key not in s.__dict__.keys()):
                setattr(s, key, value)
    s = collisionTransformation(s, vertexes)
    s = getCurveFSegment(s)
    s = getStuffSegment(s)
stadium_copy["segments"] = segments

planes = []
for p in stadium_copy["planes"]:
    planes.append(Plane(p))

for p in planes:
    if (hasattr(p, 'trait')):
        for key, value in stadium["traits"][p.trait].items():
            if (key not in p.__dict__.keys()):
                setattr(p, key, value)
    for key, value in haxball.planePhysics.items():
        if (key not in p.__dict__.keys()):
            setattr(p, key, value)

    p = collisionTransformation(p)
stadium_copy["planes"] = planes

goals = []
for g in stadium_copy["goals"]:
    goals.append(Goal(g))

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

game = Game()

# a = Player("BOT1", "1", haxball.Team["RED"], 
#            [[], [], [], [], []], resolveBotInputs1)
# setPlayerDefaultProperties(a)
# b = Player("BOT2", "1", haxball.Team["BLUE"],
#            [[], [], [], [], []], resolveBotInputs2)
# setPlayerDefaultProperties(b)
# playersArray = [a, b]

# inputArrayCurr = [[[p.name, p.avatar, p.team["id"]], []] for p in playersArray]

resetPositionDiscs()

variable = get_obs_space()

arrayRec = None

# with open("rec_py.hbr", 'w') as f:
#     json_rec = json.dumps(arrayRec, separators=(',', ':'))
#     f.write(json_rec)
