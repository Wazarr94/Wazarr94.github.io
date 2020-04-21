import gym
import json
import numpy as np
import haxballPackage.classObject as objHax
import haxballPackage.functions as fnHax
import haxballPackage.utilsHaxball as utilsHax
import haxballPackage.env as envHax

game = objHax.Game('classic.hbs', 1, 1, np.random.randint(1,3), False) # 1 minute, 1 goal, no overtime, random side to start

game.addPlayer(objHax.Player("BOT1", "1", utilsHax.haxballVal['Team']["RED"], None, None))

game.addPlayer(objHax.Player("BOT2", "1", utilsHax.haxballVal['Team']["BLUE"], None, None))

env = envHax.HaxballEnv(game)

for i_episode in range(5):
    observation = env.reset()
    for t in range(60 * 60 * 5):
        env.render()
        action = env.action_space.sample()
        observation, reward, done = env.step(action)
        if env.done:
            print("Episode DONE after {} timesteps".format(t+1))
            break
    if not env.done:
        print("Episode unfinished after {} timesteps".format(t+1))
        env.game.saveRecording(f'rec_env_{i_episode}.hbr')
    print(env.game.stadiumUsed.discs[0].x)

env.close()
