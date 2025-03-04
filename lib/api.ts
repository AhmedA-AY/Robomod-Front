export async function fetchChats(token: string) {
  // ...any additional logic...
  const response = await fetch("https://robomod.dablietech.club/api/chat?chat_id=1", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response.json()
}
