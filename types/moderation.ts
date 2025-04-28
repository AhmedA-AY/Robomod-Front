export interface ModerationSettings {
  warning_system_enabled: boolean;
  max_warnings: number;
  warning_action: string;
  warning_mute_duration: number;
  filters_enabled: boolean;
  forbidden_words: string[];
  forbidden_links: string[];
  anti_flood_enabled: boolean;
  flood_message_limit: number;
  flood_time_limit: number;
  flood_action: string;
  flood_restrict_duration: number;
} 