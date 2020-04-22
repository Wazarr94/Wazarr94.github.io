import numpy as np
import classObject as objHax
import functions as fnHax
import utilsHaxball as utilsHax

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
        self.total_reward = 0

    def calc_reward(self, env):
        return 0

    def calc_discount(self, env):
        return 0


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
            self.game.players[i].inputs = action[i]
        self._episode_ended = self.game.step()
        self._state = self.game.get_obs_space()
        rewards = [agent.calc_reward(self.game) for agent in self.agents]
        discounts = [agent.calc_discount(self.game) for agent in self.agents]

        if self._episode_ended:
            return ts.termination(np.array(self._state, dtype=np.float32), 1)
        else:
            return ts.transition(np.array(self._state, dtype=np.float32), reward=0, discount=1)

    def _reset(self):
        self.game.reset_game()
        self.__init__(self.game)
        return ts.restart(np.array(self._state, dtype=np.float32))
