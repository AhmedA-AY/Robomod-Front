export interface PointAllocations {
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
}

export interface LevelSettings {
  level_multiplier: number;
  base_points_per_level: number;
}

export interface BadgeSettings {
  badges_enabled: boolean;
  badge_list: any[]; // You might want to define a more specific type for badges
}

export interface LeaderboardSettings {
  leaderboard_types: string[];
  reset_times: Record<string, string>;
}

export interface ChallengeSettings {
  challenges_enabled: boolean;
  challenge_list: any[]; // You might want to define a more specific type for challenges
}

export interface RewardSettings {
  rewards_enabled: boolean;
  reward_list: any[]; // You might want to define a more specific type for rewards
}

export interface GamificationSettings {
  point_allocations: PointAllocations;
  level_settings: LevelSettings;
  badge_settings: BadgeSettings;
  leaderboard_settings: LeaderboardSettings;
  challenge_settings: ChallengeSettings;
  reward_settings: RewardSettings;
} 