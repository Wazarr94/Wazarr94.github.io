import gym
import math
import numpy as np
from gym import error, spaces, utils
from gym.utils import seeding
import classObject as objHax
import functions as fnHax
import utilsHaxBall as utilsHax

class Agent(objHax.Player):
    def __init__(self, player):
        super().__init__(player.name, player.avatar, player.team, player.controls, player.bot)
        self.reward = 0

    def calc_reward(self, env):
        return 0


class HaxballEnv(gym.Env):
    metadata = {'render.modes': ['human']}

    def __init__(self, game):
        self.game = game
        self.reward_range = (0, math.inf)
        self.agents = [Agent(p) for p in game.players]
        self.action_space = spaces.Tuple([spaces.Discrete(64) for _ in range(len(self.agents))])
        self.observation_space = game.stadiumUsed
        self.done = False
        game.start_game()


    def step(self, actions):
        actions = list(actions)
        for i in range(len(actions)):
            self.game.players[i].inputs = actions[i]
        done = self.game.step()
        obs = self.game.observation_space
        rewards = [agent.calc_reward(self.game) for agent in self.agents]
        return obs, rewards, done

    def reset(self):
        self.game.reset_game()
        self.__init__(self.game)
        return self.observation_space

    def render(self, mode='human'):
        pass
