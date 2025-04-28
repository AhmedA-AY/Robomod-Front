import type { GamificationSettings } from '@/types/gamification'

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
    const response = await fetch(`https://robomod.dablietech.club/api/chats/${chatId}/goodbye/message?user_id=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
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

export async function getGamificationSettings(initDataString: string, chatId: number, userId: number): Promise<GamificationSettings> {
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

export async function updateGamificationSettings(initDataString: string, chatId: number, userId: number, settings: GamificationSettings): Promise<GamificationSettings> {
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