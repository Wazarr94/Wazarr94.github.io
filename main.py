
import json
import math

class Disc:
    def __init__(self):  
        self.radius = 10  
        self.bCoef = 0.5
        self.invMass = 1
        self.damping = 0.99
        self.color = "FFFFFF"
        self.x = 0
        self.y = 0
        self.xspeed = 0
        self.yspeed = 0
        self.cGroup = 193
        self.cMask = 63

class ballPhysics(Disc):
	def __init__(self):
		super().__init__()

class playerPhysics(Disc):
    def __init__(self):
        super().__init__()
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
    def __init__(self, name = None, avatar = None, team = None, controls = None, bot = False): 
        if(name != None):
             self.name = name
        else:
            self.name = "Player" 

        if(team != None):
             self.team = team
        else:
            self.team = haxball.Team.SPECTATORS

        if(avatar != None):
            self.avatar = avatar
        else:
            self.avatar = ''

        if(controls != None):
             self.controls = controls
        else:
            self.controls = [["ArrowUp"], ["ArrowLeft"], ["ArrowDown"], ["ArrowRight"], ["KeyX"]]

        if(bot != None):
            self.bot = bot

        self.disc = None
        self.avatar = ''
        self.inputs = 0
        self.shooting = False
        self.shotReset = False
        self.spawnPoint = 0


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
        self.playerPhysics =  {
            "radius": 15,
            "bCoef": 0.5,
            "invMass": 0.5,
            "damping": 0.96,
            "acceleration": 0.1,
            "kickingAcceleration": 0.07,
            "kickingDamping": 0.96,
            "kickStrength": 5,
            "pos": [0, 0],
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
            "cMask": ["all"],
            "cGroup": ["ball"]
        }
        self.discPhysics = {
            "radius": 10,
            "bCoef": 0.5,
            "invMass": 0,
            "damping": 0.99,
            "color": 'rgb(255,255,255)',
            "cMask": ["all"],
            "cGroup": ["all"]
        }
        self.segmentPhysics = {
            "curve": 0,
            "bCoef": 1,
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
            "all": 63,
            "ball": 1,
            "blue": 4,
            "blueKO": 16,
            "c0": 268435456,
            "c1": 536870912,
            "c2": 1073741824,
            "c3": -2147483648,
            "kick": 64,
            "red": 2,
            "redKO": 8,
            "score": 128,
            "wall": 32
        }

haxball = Haxball ()
stadium = json.loads('{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')
stadiumP = json.loads('{"name":"Classic","width":420,"height":200,"spawnDistance":277.5,"bg":{"type":"grass","width":370,"height":170,"kickOffRadius":75,"cornerRadius":0},"vertexes":[{"x":-370,"y":170,"trait":"ballArea"},{"x":-370,"y":64,"trait":"ballArea"},{"x":-370,"y":-64,"trait":"ballArea"},{"x":-370,"y":-170,"trait":"ballArea"},{"x":370,"y":170,"trait":"ballArea"},{"x":370,"y":64,"trait":"ballArea"},{"x":370,"y":-64,"trait":"ballArea"},{"x":370,"y":-170,"trait":"ballArea"},{"x":0,"y":200,"trait":"kickOffBarrier"},{"x":0,"y":75,"trait":"kickOffBarrier"},{"x":0,"y":-75,"trait":"kickOffBarrier"},{"x":0,"y":-200,"trait":"kickOffBarrier"},{"x":-380,"y":-64,"trait":"goalNet"},{"x":-400,"y":-44,"trait":"goalNet"},{"x":-400,"y":44,"trait":"goalNet"},{"x":-380,"y":64,"trait":"goalNet"},{"x":380,"y":-64,"trait":"goalNet"},{"x":400,"y":-44,"trait":"goalNet"},{"x":400,"y":44,"trait":"goalNet"},{"x":380,"y":64,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-370,64],"p1":[-370,-64],"team":"red"},{"p0":[370,64],"p1":[370,-64],"team":"blue"}],"discs":[{"pos":[-370,64],"trait":"goalPost","color":"FFCCCC"},{"pos":[-370,-64],"trait":"goalPost","color":"FFCCCC"},{"pos":[370,64],"trait":"goalPost","color":"CCCCFF"},{"pos":[370,-64],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-170,"trait":"ballArea"},{"normal":[0,-1],"dist":-170,"trait":"ballArea"},{"normal":[0,1],"dist":-200,"bCoef":0.1},{"normal":[0,-1],"dist":-200,"bCoef":0.1},{"normal":[1,0],"dist":-420,"bCoef":0.1},{"normal":[-1,0],"dist":-420,"bCoef":0.1},{"bCoef":1,"dist":0,"normal":[-0.5,0.5]}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')
stadium2 = json.loads('{"name":"Big","width":600,"height":270,"spawnDistance":350,"bg":{"type":"grass","width":550,"height":240,"kickOffRadius":80,"cornerRadius":0},"vertexes":[{"x":-550,"y":240,"trait":"ballArea"},{"x":-550,"y":80,"trait":"ballArea"},{"x":-550,"y":-80,"trait":"ballArea"},{"x":-550,"y":-240,"trait":"ballArea"},{"x":550,"y":240,"trait":"ballArea"},{"x":550,"y":80,"trait":"ballArea"},{"x":550,"y":-80,"trait":"ballArea"},{"x":550,"y":-240,"trait":"ballArea"},{"x":0,"y":270,"trait":"kickOffBarrier"},{"x":0,"y":80,"trait":"kickOffBarrier"},{"x":0,"y":-80,"trait":"kickOffBarrier"},{"x":0,"y":-270,"trait":"kickOffBarrier"},{"x":-560,"y":-80,"trait":"goalNet"},{"x":-580,"y":-60,"trait":"goalNet"},{"x":-580,"y":60,"trait":"goalNet"},{"x":-560,"y":80,"trait":"goalNet"},{"x":560,"y":-80,"trait":"goalNet"},{"x":580,"y":-60,"trait":"goalNet"},{"x":580,"y":60,"trait":"goalNet"},{"x":560,"y":80,"trait":"goalNet"}],"segments":[{"v0":0,"v1":1,"trait":"ballArea"},{"v0":2,"v1":3,"trait":"ballArea"},{"v0":4,"v1":5,"trait":"ballArea"},{"v0":6,"v1":7,"trait":"ballArea"},{"v0":12,"v1":13,"trait":"goalNet","curve":-90},{"v0":13,"v1":14,"trait":"goalNet"},{"v0":14,"v1":15,"trait":"goalNet","curve":-90},{"v0":16,"v1":17,"trait":"goalNet","curve":90},{"v0":17,"v1":18,"trait":"goalNet"},{"v0":18,"v1":19,"trait":"goalNet","curve":90},{"v0":8,"v1":9,"trait":"kickOffBarrier"},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":180,"cGroup":["blueKO"]},{"v0":9,"v1":10,"trait":"kickOffBarrier","curve":-180,"cGroup":["redKO"]},{"v0":10,"v1":11,"trait":"kickOffBarrier"}],"goals":[{"p0":[-550,80],"p1":[-550,-80],"team":"red"},{"p0":[550,80],"p1":[550,-80],"team":"blue"}],"discs":[{"pos":[-550,80],"trait":"goalPost","color":"FFCCCC"},{"pos":[-550,-80],"trait":"goalPost","color":"FFCCCC"},{"pos":[550,80],"trait":"goalPost","color":"CCCCFF"},{"pos":[550,-80],"trait":"goalPost","color":"CCCCFF"}],"planes":[{"normal":[0,1],"dist":-240,"trait":"ballArea"},{"normal":[0,-1],"dist":-240,"trait":"ballArea"},{"normal":[0,1],"dist":-270,"bCoef":0.1},{"normal":[0,-1],"dist":-270,"bCoef":0.1},{"normal":[1,0],"dist":-600,"bCoef":0.1},{"normal":[-1,0],"dist":-600,"bCoef":0.1}],"traits":{"ballArea":{"vis":false,"bCoef":1,"cMask":["ball"]},"goalPost":{"radius":8,"invMass":0,"bCoef":0.5, "color" : "000000"},"goalNet":{"vis":true,"bCoef":0.1,"cMask":["ball"]},"kickOffBarrier":{"vis":false,"bCoef":0.1,"cGroup":["redKO","blueKO"],"cMask":["red","blue"]} } }')

stadium_copy = json.loads(json.dumps(stadium))

discs = stadium_copy["discs"]

def checkKick(player):
    if(player["shotReset"]):
        return not(player["shooting"])
    return player["shooting"]

def getInputs(a, b, c, d, e):
    return (a + b * 2 + c * 4 + d * 8 + e * 16)

def setDiscDefaultProperties (currentDisc, defaultDisc):
    currentDisc["x"] = defaultDisc["x"]
    currentDisc["y"] = defaultDisc["y"]
    currentDisc["xspeed"] = defaultDisc["xspeed"]
    currentDisc["yspeed"] = defaultDisc["yspeed"]
    currentDisc["radius"] = defaultDisc["radius"]
    currentDisc["bCoef"] = defaultDisc["bCoef"]
    currentDisc["invMass"] = defaultDisc["invMass"]
    currentDisc["damping"] = defaultDisc["damping"]
    currentDisc["cGroup"] = defaultDisc["cGroup"]
    currentDisc["cMask"] = defaultDisc["cMask"]


def setPlayerDefaultProperties(player):
    if (player.team == haxball.Team["SPECTATORS"]):
        player.disc = None
    else:
        player.inputs = 0
        b = player.disc
        try:
            if (b == None):
                b = playerPhysics()
                player.disc = b
                discs.append(b)
        except:
            b = playerPhysics()
            player.disc = b
            discs.append(b)

        c = collisionTransformation(haxball.playerPhysics)
        b["radius"] = c["radius"]
        b["invMass"] = c["invMass"]
        b["damping"] = c["damping"]
        b["bCoef"] = c["bCoef"]
        if(player["team"] == haxball.Team["RED"]):
            b["cMask"] = 39 + haxball.collisionFlags["redKO"]
        else:
            b["cMask"] = 39 + haxball.collisionFlags["blueKO"]
        b["cGroup"] = player.team["cGroup"] | c["cGroup"]
        b["x"] = (2 * player.team["id"] - 3) * stadium["width"]
        b["y"] = 0
        b["xspeed"] = 0
        b["yspeed"] = 0

def resetPositionDiscs():
    a = playersArray
    game["state"] = 0
    b = stadium["discs"]
    c = discs
    for d in range(0,1): # Todo : full kickoffReset
        setDiscDefaultProperties(c[d], b[d])
    b = [0, 0, 0]
    for c in range(0,len(a)):
        d = a[c]
        setPlayerDefaultProperties(d)
        e = d["team"]
        if (e != haxball["Team"]["SPECTATORS"]):
            f = d["disc"]
            g = stadium
            l = b[e["id"]]
            # Todo : teamSpawnPoints
            k = l + 1 >> 1
            if ((l % 1) == 1): k = -k
            g = stadium["spawnDistance"] * (2 * e["id"] - 3); # +- spawnDistance
            l = 55 * k
            f["x"] = g
            f["y"] = l
            b[e["id"]] += 1


def collisionTransformation(physics, vertexes = None):
    cMask = physics["cMask"]
    y = 0
    if (type(cMask) == "object"):
        for x in cMask:
            y |= haxball["collisionFlags"][x]

    physics["cMask"] = y
    cGroup = physics["cGroup"]
    y = 0
    if (type(cGroup) == "object"):
        for x in cGroup:
            y |= haxball["collisionFlags"][x]
        
    physics["cGroup"] = y
    if (y == 1): physics["cGroup"] = 193
    print(physics)
    if (physics["pos"] != None):
        physics["x"] = physics["pos"][0]
        physics["y"] = physics["pos"][1]
        physics["xspeed"] = 0
        physics["yspeed"] = 0
    
    try:
        if (physics["v0"] != None and vertexes != None):
            physics["v0"] = [vertexes[physics["v0"]]["x"], vertexes[physics["v0"]]["y"]]
            physics["v1"] = [vertexes[physics["v1"]]["x"], vertexes[physics["v1"]]["y"]]
    except:
        pass

    del physics["pos"]
    del physics["trait"]
    return physics

def getCurveFSegment(segment):
    a = segment["curve"]
    a *= .017453292519943295
    if (a < 0):
        a *= -1
        segment["curve"] *= -1
        b = segment["v0"]
        segment["v0"] = segment["v1"]
        segment["v1"] = b

    liminf = 0.17435839227423353
    limsup = 5.934119456780721
    if (a > liminf and a < limsup):
        segment["curveF"] = 1 / math.tan(a / 2)

def getStuffSegment(segment):
    if (segment["curveF"] != None): # curveF
        a = { "x": segment["v1"][0], "y": segment["v1"][1] }
        b = { "x": segment["v0"][0], "y": segment["v0"][1] }
        c = 0.5 * (a["x"] - b["x"])
        a = 0.5 * (a["y"] - b["y"])
        b = { "x": segment["v0"][0], "y": segment["v0"][1] }
        d = segment["curveF"]
        segment["circleCenter"] = [b["x"] + c + -a * d, b["y"] + a + c * d]
        a = { "x": segment["v0"][0], "y": segment["v0"][1] }
        b = segment["circleCenter"]
        c = a["x"] - b[0]
        a = a["y"] - b[1]
        segment["circleRadius"] = math.sqrt(c * c + a * a)
        c = { "x": segment["v0"][0], "y": segment["v0"][1] }
        a = segment["circleCenter"]
        segment["v0Tan"] = [-(c["y"] - a[1]), c["x"] - a[0]]
        c = segment["circleCenter"]
        a = { "x": segment["v1"][0], "y": segment["v1"][1] }
        segment["v1Tan"] = [-(c[1] - a["y"]), c[0] - a["x"]]
        if (segment["curveF"] <= 0):
            segment["v0Tan"][0] *= -1
            segment["v0Tan"][1] *= -1
            segment["v1Tan"][0] *= -1
            segment["v1Tan"][1] *= -1

    else:
        a = { "x": segment["v0"][0], "y": segment["v0"][1] }
        b = { "x": segment["v1"][0], "y": segment["v1"][1] }
        c = a["x"] - b["x"]
        a = -(a["y"] - b["y"])
        b = math.sqrt(a * a + c * c)
        segment["normal"] = [a / b, c / b]

def resolveBotInputs(player):
    if (player["disc"] != None):
        ball = discs[0]
        input = 0
        if(player["disc"]["x"] - ball["x"] > 0): input += 2 
        else: input += 8
        if(player["disc"]["y"] - ball["y"] > 0): input += 1 
        else: input += 4
        if (math.round(game["time"] * 60) % 20 == 0): input += 16
        player["inputs"] = input
        return


def resolvePlayerMovement(player):
    if (player["disc"] != None):
        playerDisc = player["disc"]
        if ((player["inputs"] & 16) != 0):
            player["shooting"] = True
        else:
            player["shooting"] = False
            player["shotReset"] = False
        if (checkKick(player)):
            g = False
            for d in discs:
                if ((d["cGroup"] & haxball["collisionFlags"]["kick"]) != 0 and d != playerDisc):
                    t = { "x": d['x'], "y": d['y'] }
                    h = { "x": playerDisc["x"], "y": playerDisc["y"] }
                    e = haxball["playerPhysics"]
                    m = t["x"] - h["x"]
                    t = t["y"] - h["y"]
                    h = math.sqrt(m * m + t * t)
                    if (h - playerDisc["radius"] - d["radius"] < 4):
                        f = m / h
                        m = t / h
                        t = e["kickStrength"]
                        d["xspeed"] = d["xspeed"] + f * t
                        d["yspeed"] = d["yspeed"] + m * t
    
                        # Todo : add kickback
    
                        g = True

            if (g):
                player["shotReset"] = True
                if (playerDisc["cMask"] != 39): playerDisc["cMask"] = 39
                # Todo : play sound

        direction = [0, 0]
        if ((player["inputs"] & 1) != 0): direction[1] -= 1
        if ((player["inputs"] & 2) != 0): direction[0] -= 1
        if ((player["inputs"] & 4) != 0): direction[1] += 1
        if ((player["inputs"] & 8) != 0): direction[0] += 1
    
        direction = normalise(direction)
    
        if(playerDisc["xspeed"] + direction[0] * (checkKick(player))):
            playerDisc["xspeed"] = playerDisc["kickingAcceleration"] 
        else: 
            playerDisc["xspeed"] = playerDisc["acceleration"]
        
        if(playerDisc["yspeed"] + direction[1] * (checkKick(player))):
            playerDisc["yspeed"] = playerDisc["kickingAcceleration"] 
        else: 
            playerDisc["yspeed"] = playerDisc["acceleration"]


def resolveDVCollision (disc, vertex):
    discPos = { "x": disc["x"], "y": disc["y"] }
    vertexPos = { "x": vertex["x"], "y": vertex["y"] }
    dist_x = discPos["x"] - vertexPos["x"]
    dist_y = discPos["y"] - vertexPos["y"]
    dist = dist_x * dist_x + dist_y * dist_y
    if (dist > 0 and dist <= disc["radius"] ** 2):
        dist = math.sqrt(dist)
        dist_x = dist_x / dist
        dist_y = dist_y / dist
        disc.x = disc["x"] + dist_x * (disc["radius"] - dist)
        disc.y = disc["y"] + dist_y * (disc["radius"] - dist)
        discSpeed = { "x": disc["xspeed"], "y": disc["yspeed"] }
        speedCoef = dist_x * discSpeed["x"] + dist_y * discSpeed["y"]
        if (speedCoef < 0):
            speedCoef *= disc["bCoef"] * vertex["bCoef"] + 1
            disc["xspeed"] = disc["xspeed"] - dist_x * speedCoef
            disc["yspeed"] = disc["yspeed"] - dist_y * speedCoef

def resolveDSCollision (disc, segment):
    distance = None
    coef_x = None
    coef_y = None
    if (segment["curveF"] == None):
        v0Pos = { "x": segment["v0"][0], "y": segment["v0"][1] }
        v1Pos = { "x": segment["v1"][0], "y": segment["v1"][1] }
        seg_x = v1Pos["x"] - v0Pos["x"]
        seg_y = v1Pos["y"] - v0Pos["y"]
        discPos = { "x": disc["x"], "y": disc["y"] }
        dist0_x = discPos["x"] - v0Pos["x"]
        dist0_y = discPos["y"] - v0Pos["y"]
        dist1_x = discPos["x"] - v1Pos["x"]
        dist1_y = discPos["y"] - v1Pos["y"]
        g = { "x": disc["x"], "y": disc["y"] }
        if (dist0_x * seg_x + dist0_y * seg_y <= 0 or dist1_x * seg_x + dist1_y * seg_y >= 0): return
        norm = normalise([segment["v0"][1] - segment["v1"][1], segment["v1"][0] - segment["v0"][0]])
        norm = { "x": -norm[0], "y": -norm[1] }
        coef_x = norm["x"]
        coef_y = norm["y"]
        distance = coef_x * dist1_x + coef_y * dist1_y
    
    else:
        circleC = segment["circleCenter"]
        discPos = { "x": disc["x"], "y": disc["y"] }
        dist_x = discPos["x"] - circleC[0]
        dist_y = discPos["y"] - circleC[1]
        tan1 = segment["v1Tan"]
        tan0 = segment["v0Tan"]
        if ((tan1[0] * dist_x + tan1[1] * dist_y > 0 and tan0[0] * dist_x + tan0[1] * dist_y > 0) == (segment["curveF"] <= 0)): return
        dist = math.sqrt(dist_x * dist_x + dist_y * dist_y)
        if (dist == 0): return
        distance = dist - segment["circleRadius"]
        coef_x = dist_x / dist
        coef_y = dist_y / dist
    
    if (distance < 0):
        distance = -distance
        coef_x = -coef_x
        coef_y = -coef_y

    if (distance < disc["radius"]):
        distance = disc["radius"] - distance
        disc["x"] = disc["x"] + coef_x * distance
        disc["y"] = disc["y"] + coef_y * distance
        discSpeed = { "x": disc["xspeed"], "y": disc["yspeed"] }
        speedCoef = coef_x * discSpeed["x"] + coef_y * discSpeed["y"]
        if (speedCoef < 0):
            speedCoef *= disc["bCoef"] * segment["bCoef"] + 1
            disc["xspeed"] = disc["xspeed"] - coef_x * speedCoef
            disc["yspeed"] = disc["yspeed"] - coef_y * speedCoef

def resolveDPCollision (disc, plane):
    norm = normalise(plane["normal"])
    norm = { "x": norm[0], "y": norm[1] }
    discPos = { "x": disc["x"], "y": disc["y"] }
    dist = plane["dist"] - (norm["x"] * discPos["x"] + norm["y"] * discPos["y"]) + disc["radius"]
    if (dist > 0):
        disc["x"] = disc["x"] + norm["x"] * dist
        disc["y"] = disc["y"] + norm["y"] * dist
        discSpeed = { "x": disc["xspeed"], "y": disc["yspeed"] }
        speedCoef = norm["x"] * discSpeed["x"] + norm["y"] * discSpeed["y"]
        if (speedCoef < 0):
            speedCoef *= disc["bCoef"] * plane["bCoef"] + 1
            disc["xspeed"] = disc["xspeed"] - norm["x"] * speedCoef
            disc["yspeed"] = disc["yspeed"] - norm["y"] * speedCoef

def resolveDDCollision (disc1, disc2):
    disc1Pos = { "x": disc1["x"], "y": disc1["y"] }
    disc2Pos = { "x": disc2["x"], "y": disc2["y"] }
    dist_x = disc1Pos["x"] - disc2Pos["x"]
    dist_y = disc1Pos["y"] - disc2Pos["y"]
    sumRadius = disc1["radius"] + disc2["radius"]
    dist = dist_x ** 2 + dist_y ** 2
    if (dist > 0 and dist <= sumRadius ** 2):
        dist = math.sqrt(dist)
        coef_x = dist_x / dist
        coef_y = dist_y / dist
        massCoef = disc1["invMass"] / (disc1["invMass"] + disc2["invMass"])
        distDiscs = sumRadius - dist
        disc1["x"] = disc1["x"] + coef_x * (distDiscs * massCoef)
        disc1["y"] = disc1["y"] + coef_y * (distDiscs * massCoef)
        distDiscs -= (distDiscs * massCoef)
        disc2["x"] = disc2["x"] - coef_x * distDiscs
        disc2["y"] = disc2["y"] - coef_y * distDiscs
        disc1Speed = { "x": disc1["xspeed"], "y": disc1["yspeed"] }
        disc2Speed = { "x": disc2["xspeed"], "y": disc2["yspeed"] }
        speedCoef = coef_x * (disc1Speed["x"] - disc2Speed["x"]) + coef_y * (disc1Speed["y"] - disc2Speed["y"])
        if (speedCoef < 0):
            speedCoef *= disc1["bCoef"] * disc2["bCoef"] + 1
            massCoef *= speedCoef
            disc1["xspeed"] = disc1["xspeed"] - coef_x * massCoef
            disc1["yspeed"] = disc1["yspeed"] - coef_y * massCoef
            massCoef = speedCoef - massCoef
            disc2["xspeed"] = disc2["xspeed"] + coef_x * massCoef
            disc2["yspeed"] = disc2["yspeed"] + coef_y * massCoef

def checkGoal (discPos, discPosPrev): # discPos : current position of scorable disc, discPosPrev : position just before
    for i in range(0,len(stadium["goals"])):
        check = None
        goal = stadium["goals"][i]
        point0 = goal["p0"]
        point1 = goal["p1"]
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
            return goal["team"]
    return haxball["Team"]["SPECTATORS"]

def norm (v):
    return math.sqrt(v[0] * v[0] + v[1] * v[1])

def dist (a, b):
    return norm([a[0] - b[0], a[1] - b[1]])

def normalise (v):
    k = norm(v)
    x = v[0] / (k or 1)
    y = v[1] / (k or 1)
    return [x, y]

for d in discs:
    if (d["trait"] != None):
        for key, value in stadium["traits"][d["trait"]].items():
            try : 
                if (d[key] == None): d[key] = value
            except:
                d[key] = value
    for (key, value) in haxball.discPhysics.items():
        try : 
            if (d[key] == None): d[key] = value
        except:
            d[key] = value
    d = collisionTransformation(d)



try :
    if(stadium_copy["ballPhysics"] == None ): ballPhysics = dict()
    else: ballPhysics = stadium_copy["ballPhysics"]
except: 
    print("do")
    ballPhysics = dict()
for key, value in haxball.ballPhysics.items():
    print((ballPhysics))
    try: 
        if (ballPhysics[key] == None): ballPhysics[key] = value
    except:
        ballPhysics[key] = value
discs.insert(0,(collisionTransformation(ballPhysics)))

vertexes = stadium_copy["vertexes"]
for v in vertexes:
    if (v["trait"] != None): 
        for key, value in stadium["traits"][v["trait"]].items():
            try:
                if (v[key] == None): v[key] = value
            except:
                v[key] = value

    for key, value in haxball.vertexPhysics.items(): 
        try:
            if (v[key] == None): v[key] = value
        except:
            v[key] = value
    v = collisionTransformation(v)

segments = stadium_copy["segments"]
for s in segments:
    if (s["trait"] != None):
        for key, value in stadium["traits"][s["trait"]].items():
            try: 
                if (s[key] == None): s[key] = value
            except:
                s[key] = value
    
    for key, value in haxball.segmentPhysics.items():
        try:
            if (s[key] == None): s[key] = value
        except:
            s[key] = value
    s = collisionTransformation(s, vertexes)
    getCurveFSegment(s)
    getStuffSegment(s)

planes = stadium_copy["planes"]
for p in planes:
    for key, value in haxball.planePhysics.items():
        try: 
            if (p[key] == None): p[key] = value
        except:
            p[key] = value
    try: 
        if (p["trait"] != None):
            for key, value in stadium["traits"][p["trait"]].items():
                p[key] = value
    except:
        pass
    p = collisionTransformation(p)

goals = stadium_copy["goals"]
for g in goals:
    if( g["team"] == "red"):
        g["team"] = haxball.Team["RED"]
    else:
        g["team"] = haxball.Team["BLUE"]

game = Game()

a = Player("Gouiri", "10", haxball.Team["RED"])
setPlayerDefaultProperties(a)
b = Player("BOT", "1", haxball.Team["BLUE"], [[], [], [], [], []], True)
setPlayerDefaultProperties(b)
playersArray = [a, b]

resetPositionDiscs()