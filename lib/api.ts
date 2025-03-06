interface Chat {
  id: number;
  title: string;
  type: string;
}

interface TelegramInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  auth_date?: number;
  hash?: string;
}

export async function fetchChats(initDataString: string) {
  console.log('Fetching chats with initData:', initDataString)
  try {
    // Parse the initData to get user_id
    const searchParams = new URLSearchParams(initDataString);
    const initDataJson = searchParams.get('user') || '{}';
    const initData: TelegramInitData = JSON.parse(decodeURIComponent(initDataJson));
    
    if (!initData.user?.id) {
      throw new Error('User ID not found in initData');
    }

    const response = await fetch(`https://robomod.dablietech.club/api/chat?chat_id=${initData.user.id}`, {
      headers: {
        'Authorization': `Bearer ${initDataString}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized: Invalid or missing token')
        throw new Error('Unauthorized: Invalid or missing token')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Fetched chats:', data)
    return data as Chat[]
  } catch (error) {
    console.error('Error fetching chats:', error)
    throw error
  }
}

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

export async function getFaqSettings(initDataString: string, chatId: number) {
  try {
    const response = await fetch(`https://robomod.dablietech.club/api/get_faq_settings?chat_id=${chatId}`, {
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
