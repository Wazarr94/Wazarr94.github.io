from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import abc
import tensorflow as tf
import numpy as np

from tf_agents.environments import py_environment
from tf_agents.environments import tf_environment
from tf_agents.environments import tf_py_environment
from tf_agents.environments import utils
from tf_agents.specs import array_spec
from tf_agents.environments import wrappers
from tf_agents.environments import suite_gym
from tf_agents.trajectories import time_step as ts

from haxballPackage.env_tf import HaxballEnv, Agent
from haxballPackage.classObject import Game, Player
from haxballPackage.utilsHaxball import haxballVal

tf.compat.v1.enable_v2_behavior()

game = Game('classic.hbs', 1, 1, 8 * np.random.randint(1, 3), False, 3)
game.addPlayer(Player("BOT1", "1", haxballVal['Team']["RED"]))
game.addPlayer(Player("BOT2", "1", haxballVal['Team']["BLUE"]))

env = HaxballEnv(game)
tf_env = tf_py_environment.TFPyEnvironment(env)

time_step = tf_env.reset()
steps = []
num_episodes = 3

for i_episode in range(num_episodes):
    episode_steps = 0
    while not time_step.is_last():
        action = tf.random.uniform((1,2), 0, 64, dtype=tf.int32)
        time_step = tf_env.step(action)
        episode_steps += 1
    steps.append(episode_steps)
    tf_env.pyenv.envs[0].game.saveRecording(f'rec_env_{i_episode}.hbr')
    time_step = tf_env.reset()

num_steps = np.sum(steps)
avg_length = np.mean(steps)

print('num_episodes:', num_episodes, 'num_steps:', num_steps)
print('avg_length', avg_length, 'avg_reward:', 0)
