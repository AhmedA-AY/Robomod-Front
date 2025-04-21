// Types
interface UserInfo {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
}

interface ChatDetails {
  id: number;
  title: string;
  type: string;
  // Add other chat details as needed
}

interface FAQSettings {
  enabled: boolean;
  message?: string;
}

interface GreetingSettings {
  enabled: boolean;
  message?: string;
}

interface GoodbyeSettings {
  enabled: boolean;
  message?: string;
}

interface GamificationSettings {
  enabled: boolean;
  point_allocations: {
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
  };
  level_settings: {
    level_multiplier: number;
    base_points_per_level: number;
  };
  badge_settings: {
    badges_enabled: boolean;
    badge_list: any[];
  };
  leaderboard_settings: {
    leaderboard_types: string[];
    reset_times: Record<string, any>;
  };
  challenge_settings: {
    challenges_enabled: boolean;
    challenge_list: any[];
  };
  reward_settings: {
    rewards_enabled: boolean;
    reward_list: any[];
  };
}

interface ModerationSettings {
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

interface ScheduledMessage {
  id: string;
  message_text: string;
  media?: string;
  starting_at: number;
  interval: number;
  enabled: boolean;
}

// Base API configuration
const API_BASE_URL = 'https://robomod.dablietech.club/api';

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  initDataString: string,
  method: string = 'GET',
  body?: any,
  queryParams?: Record<string, any>
): Promise<T> {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': body ? 'application/json' : 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    throw error;
  }
}

// User endpoints
export async function getCurrentUser(initDataString: string): Promise<UserInfo> {
  return apiRequest<UserInfo>('/user/me', initDataString);
}

// Chat endpoints
export async function getChatDetails(initDataString: string, chatId: number): Promise<ChatDetails> {
  return apiRequest<ChatDetails>(`/chats/${chatId}/details`, initDataString);
}

export async function getModeratedChats(initDataString: string): Promise<ChatDetails[]> {
  return apiRequest<ChatDetails[]>('/chats', initDataString);
}

// FAQ endpoints
export async function getFaqSettings(initDataString: string, chatId: number, userId: number): Promise<FAQSettings> {
  return apiRequest<FAQSettings>(`/chats/${chatId}/faq`, initDataString, 'GET', undefined, { user_id: userId });
}

export async function toggleFaq(initDataString: string, chatId: number, userId: number, enabled: boolean): Promise<void> {
  return apiRequest<void>(`/chats/${chatId}/faq/toggle`, initDataString, 'POST', { enabled }, { user_id: userId });
}

export async function setFaqMessage(initDataString: string, chatId: number, userId: number, message: string): Promise<void> {
  return apiRequest<void>(`/chats/${chatId}/faq/message`, initDataString, 'POST', { message }, { user_id: userId });
}

// Greeting endpoints
export async function getGreetingSettings(initDataString: string, chatId: number, userId: number): Promise<GreetingSettings> {
  return apiRequest<GreetingSettings>(`/chats/${chatId}/greeting`, initDataString, 'GET', undefined, { user_id: userId });
}

export async function toggleGreeting(initDataString: string, chatId: number, userId: number, enabled: boolean): Promise<void> {
  return apiRequest<void>(`/chats/${chatId}/greeting/toggle`, initDataString, 'POST', { enabled }, { user_id: userId });
}

export async function setGreetingMessage(initDataString: string, chatId: number, userId: number, message: string): Promise<void> {
  return apiRequest<void>(`/chats/${chatId}/greeting/message`, initDataString, 'POST', { message }, { user_id: userId });
}

// Goodbye endpoints
export async function getGoodbyeSettings(initDataString: string, chatId: number, userId: number): Promise<GoodbyeSettings> {
  return apiRequest<GoodbyeSettings>(`/chats/${chatId}/goodbye`, initDataString, 'GET', undefined, { user_id: userId });
}

export async function toggleGoodbye(initDataString: string, chatId: number, userId: number, enabled: boolean): Promise<void> {
  return apiRequest<void>(`/chats/${chatId}/goodbye/toggle`, initDataString, 'POST', enabled, { user_id: userId });
}

// Gamification endpoints
export async function getGamificationSettings(initDataString: string, chatId: number, userId: number): Promise<GamificationSettings> {
  return apiRequest<GamificationSettings>(`/chats/${chatId}/gamification/settings`, initDataString, 'GET', undefined, { user_id: userId });
}

export async function updateGamificationSettings(
  initDataString: string,
  chatId: number,
  userId: number,
  settings: Partial<GamificationSettings>
): Promise<GamificationSettings> {
  return apiRequest<GamificationSettings>(`/chats/${chatId}/gamification/settings`, initDataString, 'POST', settings, { user_id: userId });
}

// Moderation endpoints
export async function getModerationSettings(initDataString: string, chatId: number, userId: number): Promise<ModerationSettings> {
  return apiRequest<ModerationSettings>(`/chats/${chatId}/moderation/settings`, initDataString, 'GET', undefined, { user_id: userId });
}

export async function updateModerationSettings(
  initDataString: string,
  chatId: number,
  userId: number,
  settings: Partial<ModerationSettings>
): Promise<ModerationSettings> {
  return apiRequest<ModerationSettings>(`/chats/${chatId}/moderation/settings`, initDataString, 'POST', settings, { user_id: userId });
}

export async function getUserWarnings(initDataString: string, chatId: number, userId: number): Promise<any[]> {
  return apiRequest<any[]>(`/chats/${chatId}/users/${userId}/warnings`, initDataString);
}

// Scheduled Messages endpoints
export async function getScheduledMessages(initDataString: string, chatId: number): Promise<ScheduledMessage[]> {
  return apiRequest<ScheduledMessage[]>('/scheduled_messages', initDataString, 'GET', undefined, { chat_id: chatId });
}

export async function addScheduledMessage(
  initDataString: string,
  chatId: number,
  startingAt: number,
  interval: number,
  messageText?: string,
  media?: string
): Promise<ScheduledMessage> {
  const formData = new FormData();
  if (messageText) formData.append('message_text', messageText);
  if (media) formData.append('media', media);

  return apiRequest<ScheduledMessage>(
    '/add_scheduled_message',
    initDataString,
    'POST',
    formData,
    { chat_id: chatId, starting_at: startingAt, interval }
  );
}

export async function editScheduledMessage(
  initDataString: string,
  chatId: number,
  scheduleId: string,
  enabled?: boolean,
  startingAt?: number,
  interval?: number,
  messageText?: string,
  media?: string
): Promise<ScheduledMessage> {
  const formData = new FormData();
  if (messageText) formData.append('message_text', messageText);
  if (media) formData.append('media', media);

  return apiRequest<ScheduledMessage>(
    '/edit_scheduled_message',
    initDataString,
    'POST',
    formData,
    { chat_id: chatId, schedule_id: scheduleId, enabled, starting_at: startingAt, interval }
  );
}

export async function deleteScheduledMessage(initDataString: string, chatId: number, scheduleId: string): Promise<void> {
  return apiRequest<void>('/delete_scheduled_message', initDataString, 'DELETE', undefined, { chat_id: chatId, schedule_id: scheduleId });
}

// AI Query endpoint
export async function aiQuery(initDataString: string, query: string, chatId?: number): Promise<any> {
  return apiRequest<any>('/ai/query', initDataString, 'POST', { query, chat_id: chatId });
}

export async function getScheduleSettings(initData: string, chatId: number, userId: number): Promise<{ enabled: boolean; message: string; scheduleTime: string }> {
  const response = await fetch(`${API_BASE_URL}/schedule/settings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${initData}`,
      'X-Chat-ID': chatId.toString(),
      'X-User-ID': userId.toString()
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch schedule settings')
  }

  return response.json()
}

export async function toggleSchedule(initData: string, chatId: number, userId: number, enabled: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/schedule/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${initData}`,
      'X-Chat-ID': chatId.toString(),
      'X-User-ID': userId.toString()
    },
    body: JSON.stringify({ enabled })
  })

  if (!response.ok) {
    throw new Error('Failed to toggle schedule')
  }
}

export async function setScheduleMessage(initData: string, chatId: number, userId: number, message: string, scheduleTime: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/schedule/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${initData}`,
      'X-Chat-ID': chatId.toString(),
      'X-User-ID': userId.toString()
    },
    body: JSON.stringify({ message, scheduleTime })
  })

  if (!response.ok) {
    throw new Error('Failed to set schedule message')
  }
}
