import math
import copy
import numpy as np
import haxballPackage.classObject as objHax
import haxballPackage.utilsHaxBall as utilsHax

haxVal = utilsHax.haxballVal


def getInputs(a, b, c, d, e):
    return (a + b * 2 + c * 4 + d * 8 + e * 16)


def collisionTransformation(physics, vertexes=None):
    cMask = physics.cMask
    y = 0
    if (type(cMask) is list):
        for x in cMask:
            y |= haxVal["collisionFlags"][x]
    physics.cMask = y

    cGroup = physics.cGroup
    y = 0
    if (type(cGroup) is list):
        for x in cGroup:
            y |= haxVal["collisionFlags"][x]

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


def resolvePlayerMovement(player, discs):
    if (player.disc != None):
        playerDisc = player.disc
        if ((player.inputs & utilsHax.Input["SHOOT"]) != 0):
            player.shooting = True
        else:
            player.shooting = False
            player.shotReset = False

        if (player.checkKick()):
            kickDone = False
            for d in discs:
                if ((d.cGroup & haxVal['collisionFlags']["kick"]) != 0 and d != playerDisc):
                    discPos = {"x": d.x, "y": d.y}
                    playerDiscPos = {"x": playerDisc.x, "y": playerDisc.y}
                    dist_x = discPos["x"] - playerDiscPos["x"]
                    dist_y = discPos["y"] - playerDiscPos["y"]
                    dist = math.sqrt(dist_x * dist_x + dist_y * dist_y)
                    if (dist - playerDisc.radius - d.radius < 4):
                        dist_x = dist_x / dist
                        dist_y = dist_y / dist
                        kickS = haxVal['playerPhysics']["kickStrength"]
                        d.xspeed = d.xspeed + dist_x * kickS
                        d.yspeed = d.yspeed + dist_y * kickS
                        kickDone = True

            if (kickDone):
                player.shotReset = True
                if (playerDisc.cMask != 39):
                    playerDisc.cMask = 39

        direction = [0, 0]
        if ((player.inputs & utilsHax.Input["UP"]) != 0):
            direction[1] -= 1
        if ((player.inputs & utilsHax.Input["LEFT"]) != 0):
            direction[0] -= 1
        if ((player.inputs & utilsHax.Input["DOWN"]) != 0):
            direction[1] += 1
        if ((player.inputs & utilsHax.Input["RIGHT"]) != 0):
            direction[0] += 1

        direction = normalise(direction)

        if (player.checkKick()):
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


def checkGoal(discPos, discPosPrev, stadium):
    for i in range(0, len(stadium["goals"])):
        check = False
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
    return haxVal['Team']["SPECTATORS"]


def resolveBotInputs1(player, args={}):
    if (player.disc != None):
        ball = args['discs'][0]
        threshold = 2
        inputPlayer = 0
        if (player.disc.x - ball.x > threshold):
            inputPlayer += utilsHax.Input["LEFT"]
        if (player.disc.x - ball.x < -threshold):
            inputPlayer += utilsHax.Input["RIGHT"]
        if (player.disc.y - ball.y > threshold):
            inputPlayer += utilsHax.Input["UP"]
        if (player.disc.y - ball.y < -threshold):
            inputPlayer += utilsHax.Input["DOWN"]
        if ((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2 <= (ball.radius + player.disc.radius + 0.1) ** 2):
            inputPlayer += utilsHax.Input["SHOOT"]
        player.inputs = inputPlayer
        return


def resolveBotInputs2(player, args={}):
    if (player.disc != None):
        ball = args['discs'][0]
        threshold = 2
        inputPlayer = 0
        if (args['currentFrame'] % 10 == 0):
            inputPlayer += utilsHax.Input["UP"]
        if (player.disc.x - ball.x > threshold):
            inputPlayer += utilsHax.Input["LEFT"]
        if (player.disc.x - ball.x < -threshold):
            inputPlayer += utilsHax.Input["RIGHT"]
        if (player.disc.y - ball.y > threshold):
            inputPlayer += utilsHax.Input["UP"]
        if (player.disc.y - ball.y < -threshold):
            inputPlayer += utilsHax.Input["DOWN"]
        if ((player.disc.x - ball.x) ** 2 + (player.disc.y - ball.y) ** 2 <= (ball.radius + player.disc.radius + 0.05) ** 2):
            inputPlayer += utilsHax.Input["SHOOT"]
        player.inputs = inputPlayer
        return


def playInputs(player, currentFrame, args={}):
    if (player.disc != None):
        player.inputs = args["inputArray"][currentFrame[0]]
        return


def norm(v):
    return math.sqrt(v[0] * v[0] + v[1] * v[1])


def normalise(v):
    k = norm(v)
    x = v[0] / (k or 1)
    y = v[1] / (k or 1)
    return [x, y]


def transformStadium(stadium):
    discs = []
    for d in stadium["discs"]:
        discs.append(objHax.Disc(d))

    for d in discs:
        if (hasattr(d, 'trait')):
            for key, value in stadium["traits"][d.trait].items():
                if (key not in d.__dict__.keys()):
                    setattr(d, key, value)
        for (key, value) in haxVal['discPhysics'].items():
            if (key not in d.__dict__.keys()):
                setattr(d, key, value)
        d = collisionTransformation(d)

    if (stadium.get("ballPhysics") == None):
        ballPhysics = objHax.ballPhysics()
    else:
        ballPhysics = ballPhysics(stadium["ballPhysics"])

    for key, value in haxVal['ballPhysics'].items():
        if (hasattr(ballPhysics, key)):
            setattr(ballPhysics, key, value)

    discs.insert(0, (collisionTransformation(ballPhysics)))
    stadium["discs"] = discs

    vertexes = []
    for v in stadium["vertexes"]:
        vertexes.append(objHax.Vertex(v))

    for v in vertexes:
        if (hasattr(v, 'trait')):
            for key, value in stadium["traits"][v.trait].items():
                if (key not in v.__dict__.keys()):
                    setattr(v, key, value)
        for key, value in haxVal['vertexPhysics'].items():
            if (key not in v.__dict__.keys()):
                setattr(v, key, value)
        v = collisionTransformation(v)
    stadium["vertexes"] = vertexes

    segments = []
    for s in stadium["segments"]:
        segments.append(objHax.Segment(s))

    for s in segments:
        if (hasattr(s, 'trait')):
            for key, value in stadium["traits"][s.trait].items():
                if (key not in s.__dict__.keys()):
                    setattr(s, key, value)
        for key, value in haxVal['segmentPhysics'].items():
                if (key not in s.__dict__.keys()):
                    setattr(s, key, value)
        s = collisionTransformation(s, vertexes)
        s.getCurveFSegment()
        s.getStuffSegment()
    stadium["segments"] = segments

    planes = []
    for p in stadium["planes"]:
        planes.append(objHax.Plane(p))

    for p in planes:
        if (hasattr(p, 'trait')):
            for key, value in stadium["traits"][p.trait].items():
                if (key not in p.__dict__.keys()):
                    setattr(p, key, value)
        for key, value in haxVal['planePhysics'].items():
            if (key not in p.__dict__.keys()):
                setattr(p, key, value)

        p = collisionTransformation(p)
    stadium["planes"] = planes

    goals = []
    for g in stadium["goals"]:
        goals.append(objHax.Goal(g))

    for g in goals:
        if (g.team == "red"):
            g.team = haxVal['Team']["RED"]
        else:
            g.team = haxVal['Team']["BLUE"]
    stadium["goals"] = goals
    return stadium


def stadiumCopyObj(stadiumFrom, stadiumTo):
    stadiumTo["discs"] = [copy.deepcopy(d) for d in stadiumFrom['discs']]
    stadiumTo["vertexes"] = [copy.deepcopy(v) for v in stadiumFrom['vertexes']]
    stadiumTo["segments"] = [copy.deepcopy(s) for s in stadiumFrom['segments']]
    stadiumTo["planes"] = [copy.deepcopy(p) for p in stadiumFrom['planes']]
    stadiumTo["goals"] = [copy.deepcopy(g) for g in stadiumFrom['goals']]
    return stadiumTo


def getSizeProp(prop):
    return sum([arr[1] for arr in prop])


def transformObjectToList(obj, props=[]):
    objectProperties = [[np.nan for i in range(props[j][1])] for j in range(len(props))]
    if (obj != None):
        for i in range(len(props)):
            if (hasattr(obj, props[i][0])):
                objectProperties[i] = getattr(obj, props[i][0])
                if (props[i][0] == "team"):
                    objectProperties[i] = objectProperties[i]["id"]
    return objectProperties
