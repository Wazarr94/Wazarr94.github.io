import json
import haxballPackage.classObject as objHax
import haxballPackage.functions as fnHax
import haxballPackage.utilsHaxball as utilsHax

game = objHax.Game('classic.hbs')

game.add_player(objHax.Player("BOT1", "1",
                utilsHax.haxballVal['Team']["RED"], None, fnHax.resolveBotInputs1))

game.add_player(objHax.Player("BOT2", "1",
                utilsHax.haxballVal['Team']["BLUE"], None, fnHax.resolveBotInputs2))

game.start_game()

game.play_game()

game.save_recording("rec_py.hbr")
