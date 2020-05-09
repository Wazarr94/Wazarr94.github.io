import numpy as np
import ray
import gym
import pdb
import msgpack
from ray.rllib.env.multi_agent_env import MultiAgentEnv
import gym.spaces as spaces

import classObject as objHax
import functions as fnHax
import utilsHaxball as utilsHax

from ray.rllib.agents.dqn.dqn import DQNTrainer
from ray.rllib.agents.dqn.dqn_policy import DQNTFPolicy
from ray.rllib.agents.ppo.ppo import PPOTrainer
from ray.rllib.agents.ppo.ppo_tf_policy import PPOTFPolicy
from ray.rllib.tests.test_multi_agent_env import MultiCartpole
from ray.tune.logger import pretty_print
from ray.tune.registry import register_env


class Agent():
    def __init__(self, player):
        self.player = player
        self.reward = 0
        self.discount = 0
        self.total_reward = 0
        self.count_inactivity = 0
        self.max_inactivity = 10

    def calc_reward(self, env): # sanctionner si tir pour rien (verification tir + dist balle)
        rew = 0
        ball = env.game.stadiumUsed.discs[0]
        if env.game.start == False: # Goal or draw or maxFrames reached
            if env.game.red == 1 or env.game.blue == 1:
                if (env.game.red == 1 and self.player.team['id'] == 1) or (env.game.blue == 1 and self.player.team['id'] == 2):
                    rew += 1000
                else:
                    rew -= 1000
            else:
                rew -= 1000 * (env.game.time / (env.game.timeLimit * 60 * 60))
        
        elif env.game.state == 1: # simple continous reward : how far the ball goes in opposing side
            rew += (1/60) * (ball.x / 370) * (3 - 2 * self.player.team['id'])

        if env.game.state == 0 and env.game.kickoffReset == 8 * self.player.team['id']:
            self.count_inactivity += 1
        else:
            self.count_inactivity = 0

        if self.count_inactivity > self.max_inactivity * 60: # faire reward positif si déplacement vers la balle et kickoff
            rew -= (1/60) * np.sqrt((self.player.disc.x - ball.x)**2 + (self.player.disc.y - ball.y)**2) / 100
        
        self.reward = rew
        self.discount = 0
        self.total_reward += rew * (1 - self.discount)
        return rew



class HaxballEnv(MultiAgentEnv):
    def __init__(self, game):
        self.game = game
        self.agents = [Agent(p) for p in game.players]
        self.action_space = spaces.Discrete(64)
        self.observation_space = spaces.Box(shape=(len(game.get_obs_space()),), 
                low=-np.inf, 
                high=np.inf, 
                dtype=np.float32)
        self.dones = dict()
        game.start_game()

    def step(self, action_dict):
        for key, val in action_dict.items():
            self.game.players[key[0]].inputs = int(val)
        res = self.game.step()
        obs = dict()
        rew = dict()
        observation = self.game.get_obs_space()
        for key, _ in action_dict.items():
            obs[key] = observation
            rew[key] = self.agents[key[0]].calc_reward(self)
        self.dones["__all__"] = res
        return obs, rew, self.dones, {}

    def reset(self):
        self.game.save_recording('last_rec.hbr')
        self.game.reset_game()
        self.__init__(self.game)
        return {i: self.game.get_obs_space() for i in enumerate(self.agents)}


env = HaxballEnv(fnHax.game_setup())

ray.init()
register_env('haxball_env', lambda _: HaxballEnv(fnHax.game_setup()))
obs_space = env.observation_space
act_space = env.action_space

policies = {
    "ppo_policy_atk": (PPOTFPolicy, obs_space, act_space, {}),
    "ppo_policy_def": (PPOTFPolicy, obs_space, act_space, {}),
}

def policy_mapping_fn(agent_id):
    if agent_id[0] % 2 == 0:
        return "ppo_policy_atk"
    return "ppo_policy_def"

pdb.set_trace()

ppo_trainer = PPOTrainer(
        env="haxball_env",
        config={
            "multiagent": {
                "policies": policies,
                "policy_mapping_fn": policy_mapping_fn,
                "policies_to_train": ["ppo_policy_atk", "ppo_policy_def"],
            },
            "timesteps_per_iteration": 7550,
        })

for i in range(20):
        print("== Iteration", i, "==")

        # improve the PPO policy
        print("-- PPO --")
        print(pretty_print(ppo_trainer.train()))

# Policy pour le joueur qui fait le kickoff, et une pour le joueur qui reçoit
