import ray
import gym
from ray.rllib.env.multi_agent_env import MultiAgentEnv
import gym.spaces as spaces
import numpy as np

import haxballPackage.classObject as objHax
import haxballPackage.functions as fnHax
import haxballPackage.utilsHaxball as utilsHax


class Agent(objHax.Player):
    def __init__(self, player):
        super().__init__(player.name, player.avatar,
                         player.team, player.controls, player.bot)
        self.reward = 0
        self.discount = 0
        self.total_reward = 0
        self.count_inactivity = 0
        self.max_inactivity = 10

    def calc_reward_and_discount(self, env):
        self.reward = 0
        if env.game.start == False:
            if (env.game.red == 1 and self.team.id == 1) or (env.game.blue == 1 and self.team.id == 2):
                self.reward += 1000
            else:
                self.reward -= 1000

        if env.game.state == 0 and env.game.kickoffReset == 8 * self.team.id:
            self.count_inactivity += 1
        else:
            self.count_inactivity = 0

        if self.count_inactivity > self.max_inactivity * 60:
                self.reward -= 10
        self.discount = 0
        self.total_reward += self.reward * (1 - self.discount)



class HaxballEnv(MultiAgentEnv):
    def __init__(self, game):
        self.game = game
        self.agents = [Agent(p) for p in game.players]
        self.action_space = spaces.Discrete(64)
        self.observation_space = spaces.Box(shape=(len(game.get_obs_space()),), dtype=np.float32)
        self.dones = set()
        game.start_game()

    def step(self, action_dict):
        for key, val in enumerate(action_dict):
            self.game.players[key].inputs = val
        res = self.game.step()
        obs = set()
        rew = set()
        dones = self.dones
        observation = self.game.get_obs_space()
        for key, val in enumerate(action_dict):
            obs[key] = observation
            rew[key] = self.agents[key].calc_reward(self.game)
            dones[key] = res
        return obs, rew, dones

    def reset(self):
        self.game.reset_game()
        self.__init__(self.game)
        return {i: self.game.get_obs_space() for i, _ in enumerate(self.agents)}
