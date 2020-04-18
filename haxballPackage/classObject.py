import haxballPackage.utilsHaxBall as utilsHax

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
		super().__init__(utilsHax.haxballVal['playerPhysics'])


class playerPhysics(Disc):
    def __init__(self):
        super().__init__(utilsHax.haxballVal['playerPhysics'])
        self.acceleration = 0.1
        self.kickingAcceleration = 0.07
        self.kickingDamping = 0.96
        self.kickStrength = 5


class Game:
    def __init__(self, stadiumUsed = None, stadiumStored = None):
        self.state = 0
        self.start = True
        self.timeout = 0
        self.timeLimit = 3
        self.scoreLimit = 3
        self.kickoffReset = 8
        self.red = 0
        self.blue = 0
        self.time = 0
        self.teamGoal = utilsHax.haxballVal['Team']["SPECTATORS"]
        self.players = []
        self.stadiumUsed = stadiumUsed
        self.stadiumStored = stadiumStored


class Player:
    def __init__(self, name=None, avatar=None, team=None, controls=None, bot=None):
        if (name != None):
            self.name = name
        else:
            self.name = "Player"

        if (team != None):
             self.team = team
        else:
            self.team = utilsHax.haxballVal['Team']["SPECTATORS"]

        if (avatar != None):
            self.avatar = avatar
        else:
            self.avatar = ''

        if (controls != None):
             self.controls = controls
        else:
            self.controls = [["ArrowUp"], ["ArrowLeft"],
                             ["ArrowDown"], ["ArrowRight"], ["KeyX"]]

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
