export interface PointAllocations {
  [key: string]: number;
  new_message: number;
  reply_message: number;
  react_message: number;
  unreact_message: number;
  helpful_answer: number;
  share_resource: number;
  create_poll: number;
  welcome_member: number;
  report_issue: number;
  bad_behavior: number;
  warning_received: number;
}

export interface LevelSettings {
  level_multiplier: number;
  base_points_per_level: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  points_required: number;
  category: string;
}

export interface BadgeSettings {
  badges_enabled: boolean;
  badge_list: Badge[];
}

export interface LeaderboardSettings {
  leaderboard_types: string[];
  reset_times: Record<string, string>;
}

export interface Challenge {
  id: number;
  name: string;
  description: string;
  points: number;
  start_date: string;
  end_date: string;
  requirements: {
    type: string;
    target: number;
  }[];
}

export interface ChallengeSettings {
  challenges_enabled: boolean;
  challenge_list: Challenge[];
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  type: string;
  value: string;
  stock?: number;
  expiry_date?: string;
}

export interface RewardSettings {
  rewards_enabled: boolean;
  reward_list: Reward[];
}

export interface GamificationSettings {
  enabled: boolean;
  point_allocations: PointAllocations;
  level_settings: LevelSettings;
  badge_settings: BadgeSettings;
  leaderboard_settings: LeaderboardSettings;
  challenge_settings: ChallengeSettings;
  reward_settings: RewardSettings;
} 