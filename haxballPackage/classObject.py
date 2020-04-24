import json
import math
import numpy as np
import copy
import haxballPackage.utilsHaxball as utilsHax
import haxballPackage.functions as fnHax

haxVal = utilsHax.haxballVal

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

    def setDiscDefaultProperties(self, defaultDisc):
        self.x = defaultDisc.x
        self.y = defaultDisc.y
        self.xspeed = defaultDisc.xspeed
        self.yspeed = defaultDisc.yspeed
        self.radius = defaultDisc.radius
        self.bCoef = defaultDisc.bCoef
        self.invMass = defaultDisc.invMass
        self.damping = defaultDisc.damping
        self.cGroup = defaultDisc.cGroup
        self.cMask = defaultDisc.cMask


class ballPhysics(Disc):
	def __init__(self, disc=haxVal['ballPhysics']):
		super().__init__(disc)


class playerPhysics(Disc):
    def __init__(self, disc=haxVal['playerPhysics']):
        super().__init__(disc)
        self.acceleration = 0.1
        self.kickingAcceleration = 0.07
        self.kickingDamping = 0.96
        self.kickStrength = 5


class Game:
    def __init__(self, stadiumFileName = None, timeLimit = 3, scoreLimit = 3, kickoffReset = 8, overtime = True, maxMinutes = math.inf):
        self.state = 0
        self.start = True
        self.timeout = 0
        self.timeLimit = timeLimit
        self.scoreLimit = scoreLimit
        self.kickoffReset = kickoffReset
        self.red = 0
        self.blue = 0
        self.time = 0
        self.overtime = overtime
        self.maxMinutes = maxMinutes
        self.teamGoal = haxVal['Team']["SPECTATORS"]
        self.players = []
        self.stadiumFileName = stadiumFileName
        self.stadiumUsed = Stadium(stadiumFileName)
        self.stadiumStored = copy.deepcopy(self.stadiumUsed)
        self.rec = []
        self.currentFrame = -1
        self.observation_space = self.get_obs_space()

    def add_player(self, player):
        player.set_player_default_properties(self.stadiumUsed)
        self.players.append(player)
        self.observation_space = self.get_obs_space()

    def step(self):
        self.currentFrame += 1
        scoreIndex = 0
        scorableDiscsId = [0 for i in range(256)]
        scorableDiscsPos = [[0, 0] for i in range(256)]
        discs = self.stadiumUsed.discs
        planes = self.stadiumUsed.planes
        segments = self.stadiumUsed.segments
        vertexes = self.stadiumUsed.vertexes

        for i in range(len(discs)):
            disc = discs[i]
            if ((disc.cGroup & 128) != 0):
                scorableDiscsId[scoreIndex] = i
                scorableDiscsPos[scoreIndex][0] = disc.x
                scorableDiscsPos[scoreIndex][1] = disc.y
                scoreIndex += 1

        for i in range(len(self.players)):
            p = self.players[i]
            if p.team["id"] != 0:
                if p.bot:
                    p.bot(p, {'currentFrame': self.currentFrame,
                              'discs': self.stadiumUsed.discs})
                fnHax.resolvePlayerMovement(p, discs)
                self.rec[i][1].append(p.inputs)

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
                    fnHax.resolveDDCollision(d_a, d_b)
            if (d_a.invMass != 0):
                for p in planes:
                    if (((d_a.cGroup & p.cMask) != 0) and ((d_a.cMask & p.cGroup) != 0)):
                        fnHax.resolveDPCollision(d_a, p)
                for s in segments:
                    if (((d_a.cGroup & s.cMask) != 0) and ((d_a.cMask & s.cGroup) != 0)):
                        fnHax.resolveDSCollision(d_a, s)
                for v in vertexes:
                    if (((d_a.cGroup & v.cMask) != 0) and ((d_a.cMask & v.cGroup) != 0)):
                        fnHax.resolveDVCollision(d_a, v)

        if (self.state == 0):  # "kickOffReset"
            for disc in discs:
                if disc.x != None:
                    disc.cMask = 39 | self.kickoffReset
            ball = discs[0]
            if (ball.xspeed * ball.xspeed + ball.yspeed * ball.yspeed > 0):
                self.state = 1

        elif (self.state == 1):  # "gameInGoing"
            self.time += 0.016666666666666666
            for disc in discs:
                if disc.x != None:
                    disc.cMask = 39
            scoreTeam = haxVal['Team']["SPECTATORS"]
            for i in range(scoreIndex):
                scoreTeam = fnHax.checkGoal(
                    [discs[scorableDiscsId[i]].x, discs[scorableDiscsId[i]].y], scorableDiscsPos[i], self.stadiumUsed)
                if (scoreTeam != haxVal['Team']["SPECTATORS"]):
                    break
            if (scoreTeam != haxVal['Team']["SPECTATORS"]):
                self.state = 2
                self.timeout = 150
                self.teamGoal = scoreTeam
                self.kickoffReset = scoreTeam["id"] * 8
                if scoreTeam["id"] == haxVal['Team']["BLUE"]["id"]:
                    self.red += 1
                else:
                    self.blue += 1
            else:
                if (self.timeLimit > 0 and self.time >= 60 * self.timeLimit and (self.red != self.blue or not self.overtime)):
                    self.end_animation()

        elif (self.state == 2):  # "goalScored"
            self.timeout -= 1
            if (self.timeout <= 0):
                if ((self.scoreLimit > 0 and (self.red >= self.scoreLimit or self.blue >= self.scoreLimit)) or self.timeLimit > 0 and self.time >= 60 * self.timeLimit and (self.red != self.blue or not self.overtime)):
                    self.end_animation()
                else:
                    self.reset_position_discs()

        elif (self.state == 3):  # "gameEnding"
            self.timeout -= 1
            if (self.timeout <= 0 and self.start):
                self.start = False
                return True

        if (self.state != 3 and self.currentFrame >= 60 * 60 * self.maxMinutes):
            self.end_animation()
        
        return False
    
    def reset_position_discs(self):
        self.state = 0
        self.stadiumUsed.discs[0].setDiscDefaultProperties(
            self.stadiumStored.discs[0])
        teamArray = [0, 0, 0]
        for i in range(len(self.players)):
            player = self.players[i]
            player.set_player_default_properties(self.stadiumUsed)
            teamP = player.team
            if (teamP != haxVal['Team']["SPECTATORS"]):
                valueArr = teamArray[teamP['id']]
                fact = valueArr + 1 >> 1
                if ((valueArr % 2) == 1):
                    fact = -fact
                pos_x = self.stadiumStored.spawnDistance * (2 * teamP['id'] - 3)
                pos_y = 55 * fact
                player.disc.x = pos_x
                player.disc.y = pos_y
                teamArray[teamP['id']] += 1

    def end_animation(self):
        self.state = 3
        self.timeout = 300

    def start_game(self):
        self.rec = [[[p.name, p.avatar, p.team["id"]], []] for p in self.players]
        self.reset_position_discs()

    def play_game(self):
        done = False
        while done == False:
            done = self.step()

    def reset_game(self):
        playerStore = [[p.name, p.avatar, p.team, p.controls, p.bot] for p in self.players]
        self.__init__(self.stadiumFileName, self.timeLimit, self.scoreLimit, self.kickoffReset, self.overtime, self.maxMinutes)
        for arr in playerStore:
            self.add_player(Player(arr[0], arr[1], arr[2], arr[3], arr[4]))

    def save_recording(self, fileName):
        with open(f'recordings/{fileName}', 'w+') as f:
            json_rec = json.dumps(self.rec, separators=(',', ':'))
            f.write(json_rec)

    def get_stadium_obs_space(self):
        discs = self.stadiumUsed.discs
        discs_mass = [disc for disc in discs if disc.invMass != 0]
        discList = [[np.nan for i in range(fnHax.getSizeProp(utilsHax.discProperties))] for j in range(len(discs_mass))]

        for i in range(len(discs_mass)):
            discList[i] = list(np.hstack(fnHax.transformObjectToList(discs_mass[i], utilsHax.discProperties)))
        return discList

    def get_game_obs_space(self):
        return [self.blue, self.kickoffReset, self.red, self.scoreLimit, self.state, self.time, self.timeLimit]

    def get_obs_space(self):
        return list(np.hstack(self.get_game_obs_space() + self.get_stadium_obs_space()))


class Player:
    def __init__(self, name=None, avatar=None, team=None, controls=None, bot=None):
        if (name != None):
            self.name = name
        else:
            self.name = "Player"

        if (team != None):
             self.team = team
        else:
            self.team = haxVal['Team']["SPECTATORS"]

        if (avatar != None):
            self.avatar = avatar
        else:
            self.avatar = ''

        if (controls != None):
             self.controls = controls
        else:
            self.controls = [["ArrowUp"], ["ArrowLeft"],
                             ["ArrowDown"], ["ArrowRight"], ["KeyX"]]

        self.bot = bot

        self.disc = None
        self.inputs = 0
        self.shooting = False
        self.shotReset = False
        self.spawnPoint = 0

    def set_player_default_properties(self, stadium):
        if (self.team == haxVal["Team"]["SPECTATORS"]):
            self.disc = None
        else:
            self.inputs = 0
            if (self.disc == None):
                b = playerPhysics()
                self.disc = b
                stadium.discs.append(b)

            c = fnHax.collisionTransformation(Disc(haxVal['playerPhysics']))
            self.disc.radius = c.radius
            self.disc.invMass = c.invMass
            self.disc.damping = c.damping
            self.disc.bCoef = c.bCoef
            if (self.team == haxVal['Team']["RED"]):
                self.disc.cMask = 39 + haxVal['collisionFlags']["redKO"]
            else:
                self.disc.cMask = 39 + haxVal['collisionFlags']["blueKO"]
            self.disc.cGroup = self.team["cGroup"] | c.cGroup
            self.disc.x = (2 * self.team["id"] - 3) * stadium.width
            self.disc.y = 0
            self.disc.xspeed = 0
            self.disc.yspeed = 0

    def check_kick(self):
        if (self.shotReset):
            return not(self.shooting)
        return self.shooting


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

    def get_stuff_segment(self):
        if (hasattr(self, "curveF")):
            segV1 = {"x": self.v1[0], "y": self.v1[1]}
            segV0 = {"x": self.v0[0], "y": self.v0[1]}
            dist_x = 0.5 * (segV1["x"] - segV0["x"])
            dist_y = 0.5 * (segV1["y"] - segV0["y"])
            self.circleCenter = [segV0["x"] + dist_x - dist_y * self.curveF,
                                 segV0["y"] + dist_y + dist_x * self.curveF]
            dist_x_CC = segV0["x"] - self.circleCenter[0]
            dist_y_CC = segV0["y"] - self.circleCenter[1]
            self.circleRadius = math.sqrt(
                dist_x_CC * dist_x_CC + dist_y_CC * dist_y_CC)
            self.v0Tan = [-(segV0["y"] - self.circleCenter[1]),
                          segV0["x"] - self.circleCenter[0]]
            self.v1Tan = [-(self.circleCenter[1] - segV1["y"]),
                            self.circleCenter[0] - segV1["x"]]
            if (self.curveF <= 0):
                self.v0Tan[0] *= -1
                self.v0Tan[1] *= -1
                self.v1Tan[0] *= -1
                self.v1Tan[1] *= -1
        else:
            segV0 = {"x": self.v0[0], "y": self.v0[1]}
            segV1 = {"x": self.v1[0], "y": self.v1[1]}
            dist_x = segV0["x"] - segV1["x"]
            dist_y = -(segV0["y"] - segV1["y"])
            dist = math.sqrt(dist_x * dist_x + dist_y * dist_y)
            setattr(self, 'normal', [dist_y / dist, dist_x / dist])

    def get_curvef_segment(self):
        a = self.curve
        a *= .017453292519943295
        if (a < 0):
            a *= -1
            self.curve *= -1
            b = self.v0
            self.v0 = self.v1
            self.v1 = b

        liminf = 0.17435839227423353
        limsup = 5.934119456780721
        if (a > liminf and a < limsup):
            self.curveF = 1 / math.tan(a / 2)


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


class Stadium:
    def __init__(self, stadiumFile = None):
        if (stadiumFile != None):
            with open(f'stadiums/{stadiumFile}', 'r') as f:
                stad = json.loads(f.read())
            self.discs = stad['discs']
            self.planes = stad['planes']
            self.segments = stad['segments']
            self.vertexes = stad['vertexes']
            self.goals = stad['goals']
            self.height = stad['height']
            self.width = stad['width']
            self.spawnDistance = stad['spawnDistance']

            if (stad.get("traits") == None):
                self.traits = {}
            else:
                self.traits = stad['traits']
                
            if (stad.get("ballPhysics") == None):
                self.ballPhysics = ballPhysics()
            else:
                self.ballPhysics = ballPhysics(stad['ballPhysics'])
            self.transform_stadium()
        else:
            self.discs = []
            self.planes = []
            self.segments = []
            self.vertexes = []
            self.goals = []
            self.traits = {}
            self.ballPhysics = ballPhysics()
    
    def transform_stadium(self):
        discs = []
        for d in self.discs:
            discs.append(Disc(d))

        for d in discs:
            if (hasattr(d, 'trait')):
                for key, value in self.traits[d.trait].items():
                    if (key not in d.__dict__.keys()):
                        setattr(d, key, value)
            for (key, value) in haxVal['discPhysics'].items():
                if (key not in d.__dict__.keys()):
                    setattr(d, key, value)
            d = fnHax.collisionTransformation(d)

        for key, value in haxVal['ballPhysics'].items():
            if (hasattr(self.ballPhysics, key)):
                setattr(self.ballPhysics, key, value)

        discs.insert(0, (fnHax.collisionTransformation(self.ballPhysics)))
        self.discs= discs

        vertexes = []
        for v in self.vertexes:
            vertexes.append(Vertex(v))

        for v in vertexes:
            if (hasattr(v, 'trait')):
                for key, value in self.traits[v.trait].items():
                    if (key not in v.__dict__.keys()):
                        setattr(v, key, value)
            for key, value in haxVal['vertexPhysics'].items():
                if (key not in v.__dict__.keys()):
                    setattr(v, key, value)
            v = fnHax.collisionTransformation(v)
        self.vertexes = vertexes

        segments = []
        for s in self.segments:
            segments.append(Segment(s))

        for s in segments:
            if (hasattr(s, 'trait')):
                for key, value in self.traits[s.trait].items():
                    if (key not in s.__dict__.keys()):
                        setattr(s, key, value)
            for key, value in haxVal['segmentPhysics'].items():
                    if (key not in s.__dict__.keys()):
                        setattr(s, key, value)
            s = fnHax.collisionTransformation(s, vertexes)
            s.get_curvef_segment()
            s.get_stuff_segment()
        self.segments = segments

        planes = []
        for p in self.planes:
            planes.append(Plane(p))

        for p in planes:
            if (hasattr(p, 'trait')):
                for key, value in self.traits[p.trait].items():
                    if (key not in p.__dict__.keys()):
                        setattr(p, key, value)
            for key, value in haxVal['planePhysics'].items():
                if (key not in p.__dict__.keys()):
                    setattr(p, key, value)

            p = fnHax.collisionTransformation(p)
        self.planes = planes

        goals = []
        for g in self.goals:
            goals.append(Goal(g))

        for g in goals:
            if (g.team == "red"):
                g.team = haxVal['Team']["RED"]
            else:
                g.team = haxVal['Team']["BLUE"]
        self.goals = goals
