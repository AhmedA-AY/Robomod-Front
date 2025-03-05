export async function fetchChats(token: string) {
  console.log('Fetching chats with token:', token)
  try {
    const response = await fetch("https://robomod.dablietech.club/api/chat?chat_id=1", {
      headers: {
        Authorization: token,
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('Unauthorized: Invalid or missing token')
        return []
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Fetched chats:', data)
    return data
  } catch (error) {
    console.error('Error fetching chats:', error)
    return []
  }
}
