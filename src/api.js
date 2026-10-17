// Адреса API сервера (http://localhost:8000). Поменяй, если у тебя другие.
export const USERS_URL = '/api/users'
export const TOPICS_URL = '/api/topics'
export const LOGIN_URL = '/api/login'
export const LOGOUT_URL = '/api/logout'
export const CREATE_NEW_USER_URL = '/api/create_new_user'
export const CREATE_NEW_TOPIC_URL = '/api/create_new_topic'
export const MESSAGES_URL = '/api/messages'
// Картинка CAPTCHA. На сервере этого endpoint пока нет
export const CAPTCHA_URL = '/api/captcha'

// Ключ, под которым токен лежит в localStorage
export const TOKEN_STORAGE_KEY = 'token'
// Ключ, под которым в localStorage лежит логин из ответа сервера (вход или регистрация)
export const LOGIN_STORAGE_KEY = 'login'
// Ключ, под которым в localStorage лежит email из ответа сервера (вход или регистрация)
export const EMAIL_STORAGE_KEY = 'email'

// POST {"login": "...", "password": "..."} -> {"token": "...", "login": "...", "email": "..."}.
// При успехе в localStorage сохраняются токен, логин и email из ответа сервера; ответ возвращается.
export async function login(loginValue, password) {
  const res = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginValue, password: password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `${res.status} ${res.statusText}`)
  localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
  localStorage.setItem(LOGIN_STORAGE_KEY, data.login)
  localStorage.setItem(EMAIL_STORAGE_KEY, data.email)
  return data
}

// Токен, логин и email удаляются из localStorage, затем POST на LOGOUT_URL с заголовком Authorization: Bearer <token>.
// Ответ сервера не проверяется.
export async function logout() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(LOGIN_STORAGE_KEY)
  localStorage.removeItem(EMAIL_STORAGE_KEY)
  await fetch(LOGOUT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// POST {"login": "...", "email": "...", "password": "..."} на CREATE_NEW_USER_URL
// -> {"token": "...", "login": "...", "email": "..."}.
// При успехе в localStorage сохраняются токен, логин и email из ответа сервера; ответ возвращается.
// При ошибке текст берётся из поля "error" ответа, если ответ — JSON, иначе из статуса.
export async function createNewUser(loginValue, email, password) {
  const res = await fetch(CREATE_NEW_USER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginValue, email: email, password: password }),
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data.error) message = data.error
    } catch {
      // Тело ответа не JSON — оставляем статус
    }
    throw new Error(message)
  }
  const data = await res.json()
  localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
  localStorage.setItem(LOGIN_STORAGE_KEY, data.login)
  localStorage.setItem(EMAIL_STORAGE_KEY, data.email)
  return data
}

// POST {"title": "..."} на CREATE_NEW_TOPIC_URL с заголовком Authorization: Bearer <token из localStorage>.
// При ошибке текст берётся из поля "error" ответа, если ответ — JSON, иначе из статуса.
export async function createNewTopic(title) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const res = await fetch(CREATE_NEW_TOPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: title }),
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data.error) message = data.error
    } catch {
      // Тело ответа не JSON — оставляем статус
    }
    throw new Error(message)
  }
}

// GET MESSAGES_URL?topic_id=<topicId> -> [{"message_id", "text", "user_id", "user__login", "created_at"}, ...]
export async function getMessages(topicId) {
  return getJson(`${MESSAGES_URL}?topic_id=${encodeURIComponent(topicId)}`)
}

export async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const data = await res.json()
  // Поддержка и простого массива, и пагинации DRF ({ results: [...] })
  return Array.isArray(data) ? data : data.results ?? []
}
