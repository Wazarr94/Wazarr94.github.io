import json
import haxballPackage.classObject as objHax
import haxballPackage.functions as fnHax
import haxballPackage.utilsHaxball as utilsHax

game = objHax.Game('classic.hbs')

game.addPlayer(objHax.Player("BOT1", "1",
                utilsHax.haxballVal['Team']["RED"], None, fnHax.resolveBotInputs1))

game.addPlayer(objHax.Player("BOT2", "1",
                utilsHax.haxballVal['Team']["BLUE"], None, fnHax.resolveBotInputs2))

game.start_game()

game.play_game()

game.saveRecording("rec_py.hbr")
