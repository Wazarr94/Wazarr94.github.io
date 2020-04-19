Input = {'LEFT': 2, 'RIGHT': 8, 'UP': 1, 'DOWN': 4, 'SHOOT': 16}

haxballVal = {
    "Team": {
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
    },
    "playerPhysics": {
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
    },
    "ballPhysics": {
        "radius": 10,
        "bCoef": 0.5,
        "invMass": 1,
        "damping": 0.99,
        "color": "FFFFFF",
        "pos": [0, 0],
        "speed": [0, 0],
        "cMask": ["all"],
        "cGroup": ["ball"]
    },
    "discPhysics": {
        "radius": 10,
        "bCoef": 0.5,
        "invMass": 0,
        "damping": 0.99,
        "speed": [0, 0],
        "color": 'rgb(255,255,255)',
        "cMask": ["all"],
        "cGroup": ["all"]
    },
    "segmentPhysics": {
        "curve": 0,
        "bCoef": 1,
        "color": 'rgb(255,255,255)',
        "cGroup": ["wall"],
        "cMask": ["all"]
    },
    "planePhysics": {
        "bCoef": 1,
        "cGroup": ["wall"],
        "cMask": ["all"]
    },
    "vertexPhysics": {
        "bCoef": 1,
        "cGroup": ["wall"],
        "cMask": ["all"]
    },
    "collisionFlags": {
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
}

discProperties = [['acceleration', 1], ['bCoef', 1],
                  ['cGroup', 1], ['cMask', 1], ['damping', 1], ['invMass', 1],
                  ['kickStrength', 1], ['kickingAcceleration', 1], ['kickingDamping', 1],
                  ['radius', 1], ['x', 1], ['xspeed', 1], ['y', 1], ['yspeed', 1]]

vertexProperties = [['bCoef', 1], ['cGroup', 1],
                    ['cMask', 1], ['x', 1], ['y', 1]]

segmentProperties = [['bCoef', 1], ['cGroup', 1], ['cMask', 1], ['circleCenter', 2],
                     ['circleRadius', 1], ['curve', 1], ['curveF', 1], ['normal', 2],
                     ['v0', 2], ['v0Tan', 2], ['v1', 2], ['v1Tan', 2]]

planeProperties = [['bCoef', 1], ['cGroup', 1],
                   ['cMask', 1], ['dist', 1], ['normal', 2]]
                   
goalProperties = [['p0', 2], ['p1', 2], ['team', 1]]
