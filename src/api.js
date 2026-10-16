// Адреса API сервера (http://localhost:8000). Поменяй, если у тебя другие.
export const USERS_URL = '/api/users'
export const TOPICS_URL = '/api/topics'

export async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = await res.json()
  // Поддержка и простого массива, и пагинации DRF ({ results: [...] })
  return Array.isArray(data) ? data : data.results ?? []
}
