
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
        self.teamGoal = 'haxball.Team.SPECTATORS'

class Player:    
    def __init__(self, name, avatar, team, controls, bot): 
        if(name != None):
             self.name = name
        else:
            self.name = "Player" 

        if(team != None):
             self.team = team
        else:
            self.team = 'haxball.Team.SPECTATORS'

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
        else:
            self.bot = False

        self.disc = None
        self.avatar = ''
        self.inputs = 0
        self.shooting = False
        self.shotReset = False
        self.spawnPoint = 0


class Haxball:
    def __init__(self):
        self.Team = {
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