import numpy as np
import haxballPackage.classObject as objHax
import haxballPackage.functions as fnHax
import haxballPackage.utilsHaxball as utilsHax

from tf_agents.environments import py_environment
from tf_agents.environments import tf_environment
from tf_agents.environments import tf_py_environment
from tf_agents.environments import utils
from tf_agents.specs import array_spec
from tf_agents.environments import wrappers
from tf_agents.environments import suite_gym
from tf_agents.trajectories import time_step as ts


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


class HaxballEnv(py_environment.PyEnvironment):
    def __init__(self, game):
        self.game = game
        self.agents = [Agent(p) for p in game.players]
        self._observation_spec = array_spec.ArraySpec(
            shape=(len(game.get_obs_space()),), dtype=np.float32, name='observation')
        self._action_spec = array_spec.BoundedArraySpec(
            shape=(len(self.agents),), dtype=np.int32, minimum=0, maximum=63, name='action')
        self._state = game.get_obs_space()
        self._episode_ended = False
        game.start_game()

    def action_spec(self):
        return self._action_spec

    def observation_spec(self):
        return self._observation_spec

    def _step(self, action):
        if self._episode_ended:
            return self.reset()
        for i in range(len(action)):
            self.game.players[i].inputs = int(action[i])
        self._episode_ended = self.game.step()
        self._state = self.game.get_obs_space()
        for agent in self.agents:
            agent.calc_reward_and_discount(self)

        if self._episode_ended:
            return ts.termination(np.array(self._state, dtype=np.float32), 0)
        else:
            return ts.transition(np.array(self._state, dtype=np.float32), reward=0, discount=1)

    def _reset(self):
        self.game.reset_game()
        self.__init__(self.game)
        return ts.restart(np.array(self._state, dtype=np.float32))
