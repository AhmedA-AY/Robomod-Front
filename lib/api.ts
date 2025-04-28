export async function getModeratorChat(initDataString: string, moderatorUserId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/get_moderator_chat?moderator_user_id=${moderatorUserId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching moderator chat:', error);
    throw error;
  }
}

export async function getCurrentUserInfo(initDataString: string) {
  try {
    const response = await fetch('https://robomod.dablietech.club/api/user/me', {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current user info:', error);
    throw error;
  }
}

export async function getChatsModeratedByUser(initDataString: string) {
  try {
    const response = await fetch('https://robomod.dablietech.club/api/chats', {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching moderated chats:', error);
    throw error;
  }
}

export async function getChatDetails(initDataString: string, chatId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/details`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chat details:', error);
    throw error;
  }
}

export async function getFaqSettings(initDataString: string, chatId: number, userId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/faq?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching FAQ settings:', error);
    throw error;
  }
}

export async function toggleFaq(initDataString: string, chatId: number, userId: number, enabled: boolean) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/faq/toggle?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error toggling FAQ:', error);
    throw error;
  }
}

export async function setFaqMessage(initDataString: string, chatId: number, userId: number, message: string) {
  try {
    const formData = new FormData();
    formData.append('message', message);
    
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/faq/message?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error setting FAQ message:', error);
    throw error;
  }
}

export async function getGreetingSettings(initDataString: string, chatId: number, userId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/greeting?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching greeting settings:', error);
    throw error;
  }
}

export async function toggleGreeting(initDataString: string, chatId: number, userId: number, enabled: boolean) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/greeting/toggle?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error toggling greeting:', error);
    throw error;
  }
}

export async function setGreetingMessage(initDataString: string, chatId: number, userId: number, message: string) {
  try {
    const formData = new FormData();
    formData.append('message', message);
    
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/greeting/message?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error setting greeting message:', error);
    throw error;
  }
}

export async function getGoodbyeSettings(initDataString: string, chatId: number, userId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/goodbye?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching goodbye settings:', error);
    throw error;
  }
}

export async function toggleGoodbye(initDataString: string, chatId: number, userId: number, enabled: boolean) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/goodbye/toggle?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enabled),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error toggling goodbye:', error);
    throw error;
  }
}

export async function setGoodbyeMessage(initDataString: string, chatId: number, userId: number, message: string) {
  try {
    const formData = new FormData();
    formData.append('message', message);
    
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/goodbye/message?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error setting goodbye message:', error);
    throw error;
  }
}

interface GamificationSettings {
  point_allocations: {
    [key: string]: number;
  };
  level_settings: {
    levels_enabled: boolean;
    level_list: Array<{
      level: number;
      points_required: number;
    }>;
  };
  challenge_settings: {
    challenges_enabled: boolean;
    challenge_list: Array<{
      id: number;
      name: string;
      description: string;
      points: number;
    }>;
  };
  reward_settings: {
    rewards_enabled: boolean;
    reward_list: Array<{
      id: number;
      name: string;
      description: string;
      points_cost: number;
    }>;
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

export async function getGamificationSettings(initDataString: string, chatId: number, userId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/gamification/settings?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching gamification settings:', error);
    throw error;
  }
}

export async function updateGamificationSettings(initDataString: string, chatId: number, userId: number, settings: GamificationSettings) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/gamification/settings?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating gamification settings:', error);
    throw error;
  }
}

export async function getModerationSettings(initDataString: string, chatId: number, userId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/moderation/settings?user_id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching moderation settings:', error);
    throw error;
  }
}

export async function updateModerationSettings(initDataString: string, chatId: number, userId: number, settings: ModerationSettings) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/moderation/settings?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating moderation settings:', error);
    throw error;
  }
}

export async function getUserWarnings(initDataString: string, chatId: number, userId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/users/${userId}/warnings`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user warnings:', error);
    throw error;
  }
}

export async function getScheduledMessages(initDataString: string, chatId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/scheduled_messages?chat_id=${chatId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    throw error;
  }
}

export async function addScheduledMessage(initDataString: string, chatId: number, startingAt: number, interval: number, messageText?: string, media?: File) {
  try {
    const formData = new FormData();
    if (messageText) formData.append('message_text', messageText);
    if (media) formData.append('media', media);
    
    const response = await fetch(`https://robomod.dablietech.club/api/add_scheduled_message?chat_id=${chatId}&starting_at=${startingAt}&interval=${interval}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding scheduled message:', error);
    throw error;
  }
}

export async function editScheduledMessage(
  initDataString: string, 
  chatId: number, 
  scheduleId: string, 
  params: {
    enabled?: boolean, 
    startingAt?: number, 
    interval?: number, 
    messageText?: string, 
    media?: File
  }
) {
  try {
    const formData = new FormData();
    if (params.messageText !== undefined) formData.append('message_text', params.messageText);
    if (params.media) formData.append('media', params.media);
    
    let url = `https://robomod.dablietech.club/api/edit_scheduled_message?chat_id=${chatId}&schedule_id=${scheduleId}`;
    if (params.enabled !== undefined) url += `&enabled=${params.enabled}`;
    if (params.startingAt !== undefined) url += `&starting_at=${params.startingAt}`;
    if (params.interval !== undefined) url += `&interval=${params.interval}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error editing scheduled message:', error);
    throw error;
  }
}

export async function deleteScheduledMessage(initDataString: string, chatId: number, scheduleId: string) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/delete_scheduled_message?chat_id=${chatId}&schedule_id=${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting scheduled message:', error);
    throw error;
  }
}

export async function getMessage(initDataString: string, chatId: number, messageId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/message?chat_id=${chatId}&message_id=${messageId}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
  }
}

export async function aiQuery(initDataString: string, query: string, chatId?: number) {
  try {
    const payload: { query: string; chat_id?: number } = { query };
    if (chatId !== undefined) payload.chat_id = chatId;
    
    const response = await fetch('https://robomod.dablietech.club/api/ai/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error with AI query:', error);
    throw error;
  }
}
