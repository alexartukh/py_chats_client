// Адрес сервера. Локально пустой: запросы /api/... идут через proxy Vite (vite.config.js).
// При сборке для хостинга задаётся переменной VITE_API_BASE, например https://py-chats.onrender.com
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Адреса API сервера (http://localhost:8000). Поменяй, если у тебя другие.
export const USERS_URL = API_BASE + '/api/users'
export const TOPICS_URL = API_BASE + '/api/topics'
export const LOGIN_URL = API_BASE + '/api/login'
export const LOGOUT_URL = API_BASE + '/api/logout'
export const CREATE_NEW_USER_URL = API_BASE + '/api/create_new_user'
export const CREATE_NEW_TOPIC_URL = API_BASE + '/api/create_new_topic'
export const TOPIC_URL = API_BASE + '/api/topic'
export const MESSAGES_URL = API_BASE + '/api/messages'
export const GET_ALL_ROOT_MESSAGES_URL = API_BASE + '/api/get_all_root_messages'
export const CREATE_NEW_MESSAGE_URL = API_BASE + '/api/create_new_message'
export const DELETE_EXISTING_MESSAGE_URL = API_BASE + '/api/delete_existing_message'
// CAPTCHA: GET отдаёт JSON с новой капчей (см. getCaptcha)
export const CAPTCHA_URL = API_BASE + '/api/captcha'

// Ключ, под которым токен лежит в localStorage
export const TOKEN_STORAGE_KEY = 'token'
// Ключ, под которым в localStorage лежит логин из ответа сервера (вход или регистрация)
export const LOGIN_STORAGE_KEY = 'login'
// Ключ, под которым в localStorage лежит email из ответа сервера (вход или регистрация)
export const EMAIL_STORAGE_KEY = 'email'

// Текст ошибки, когда защищённый запрос получил 401
export const SESSION_EXPIRED_MESSAGE = 'Сессия истекла, войдите снова'

// Текст ошибки, когда запрос не дошёл до сервера (сервер выключен, нет сети, запрет CORS)
export const SERVER_UNAVAILABLE_MESSAGE = 'Сервер недоступен. Проверьте, что он запущен, и повторите'

// fetch, который при сетевой ошибке выбрасывает понятный текст SERVER_UNAVAILABLE_MESSAGE.
// Обычный fetch в этом случае выбрасывает TypeError с текстом вроде "Failed to fetch".
// Ответы с кодом ошибки (4xx, 5xx) fetch ошибкой не считает — их разбирает readErrorMessage.
async function apiFetch(url, options) {
  try {
    return await fetch(url, options)
  } catch {
    throw new Error(SERVER_UNAVAILABLE_MESSAGE)
  }
}

// Текст ошибки для ответа с кодом ошибки (res.ok === false).
// Если сервер прислал JSON {"error": "..."} — берётся его текст (он точнее: например, "captcha answer is wrong").
// Иначе (тело не JSON: страница ошибки Django, пустой ответ proxy Vite при выключенном сервере) — текст по коду ответа.
async function readErrorMessage(res) {
  try {
    const data = await res.json()
    if (typeof data.error === 'string' && data.error !== '') {
      return data.error
    }
  } catch {
    // Тело ответа не JSON — текст выбирается по коду ниже
  }

  if (res.status === 400) {
    return 'Сервер не принял данные (400)'
  }
  if (res.status === 401) {
    return 'Нужно войти (401)'
  }
  if (res.status === 403) {
    return 'Нет прав на это действие (403)'
  }
  if (res.status === 404) {
    return 'Не найдено (404)'
  }
  if (res.status === 409) {
    return 'Такие данные уже есть (409)'
  }
  if (res.status === 413) {
    return 'Слишком большой запрос, например файл (413)'
  }
  if (res.status >= 500) {
    // proxy Vite отвечает 500 с пустым телом, если сервер Django не запущен
    return `Ошибка на сервере или сервер не запущен (${res.status})`
  }
  return `Ошибка запроса (${res.status})`
}

// Функция, которую api.js вызывает, когда защищённый запрос получил 401.
// Её устанавливает AuthContext через setSessionExpiredHandler, чтобы сбросить состояние входа.
let sessionExpiredHandler = null

export function setSessionExpiredHandler(handler) {
  sessionExpiredHandler = handler
}

// Вызывается только в защищённых запросах (create_new_topic, create_new_message, delete_existing_message).
// В /api/login 401 означает неверный логин или пароль, поэтому там эта функция не вызывается.
// При 401: удаляет токен, логин и email из localStorage, вызывает sessionExpiredHandler
// и выбрасывает ошибку с текстом SESSION_EXPIRED_MESSAGE. Запрос на /api/logout не отправляется.
function throwIfSessionExpired(res) {
  if (res.status !== 401) {
    return
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(LOGIN_STORAGE_KEY)
  localStorage.removeItem(EMAIL_STORAGE_KEY)
  if (sessionExpiredHandler !== null) {
    sessionExpiredHandler()
  }
  throw new Error(SESSION_EXPIRED_MESSAGE)
}

// POST {"login": "...", "password": "..."} -> {"token": "...", "login": "...", "email": "..."}.
// При успехе в localStorage сохраняются токен, логин и email из ответа сервера; ответ возвращается.
export async function login(loginValue, password) {
  const res = await apiFetch(LOGIN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginValue, password: password }),
  })
  // Сначала проверяется код ответа, потом читается JSON: у ответа с ошибкой тела может не быть вовсе
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  const data = await res.json()
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
  await apiFetch(LOGOUT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

// POST {"login": "...", "email": "...", "password": "..."} на CREATE_NEW_USER_URL
// -> {"token": "...", "login": "...", "email": "..."}.
// При успехе в localStorage сохраняются токен, логин и email из ответа сервера; ответ возвращается.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function createNewUser(loginValue, email, password) {
  const res = await apiFetch(CREATE_NEW_USER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginValue, email: email, password: password }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  const data = await res.json()
  localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
  localStorage.setItem(LOGIN_STORAGE_KEY, data.login)
  localStorage.setItem(EMAIL_STORAGE_KEY, data.email)
  return data
}

// POST {"title": "..."} на CREATE_NEW_TOPIC_URL с заголовком Authorization: Bearer <token из localStorage>.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function createNewTopic(title) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const res = await apiFetch(CREATE_NEW_TOPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: title }),
  })
  throwIfSessionExpired(res)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
}

// GET TOPIC_URL?topic_id=<topicId> -> {"topic_id", "title", "created_by_user__login", "created_at"}; ответ возвращается.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function getTopic(topicId) {
  const res = await apiFetch(`${TOPIC_URL}?topic_id=${encodeURIComponent(topicId)}`)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

// GET MESSAGES_URL?topic_id=<topicId>&from=<from>&to=<to>
// -> [{"message_id", "parent_message_id", "t", "attachment", "attachment_name", "user_id", "user__login", "created_at", "depth"}, ...]
// from и to — номера сообщений (с 1, включительно) среди ВСЕХ сообщений темы, упорядоченных LIFO:
// по created_at по убыванию, затем по message_id по убыванию. № 1 — самое новое сообщение.
// Сервер отдаёт эти сообщения в порядке дерева. Ответ, родитель которого не попал в диапазон,
// становится корнем страницы, но depth у него — настоящая глубина в дереве темы.
// За пределами темы сервер отдаёт пустой массив.
export async function getMessages(topicId, from, to) {
  return getJson(
    `${MESSAGES_URL}?topic_id=${encodeURIComponent(topicId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  )
}

// GET GET_ALL_ROOT_MESSAGES_URL?topic_id=<topicId> -> только корневые сообщения темы (parent_message_id = null):
// [{"message_id", "parent_message_id", "t", "attachment", "attachment_name", "user_id", "user__login", "created_at", "depth"}, ...]
// Сервер сортирует их от старых к новым.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function getAllRootMessages(topicId) {
  const res = await apiFetch(`${GET_ALL_ROOT_MESSAGES_URL}?topic_id=${encodeURIComponent(topicId)}`)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

// Читает файл и возвращает его содержимое строкой base64 (без префикса "data:<тип>;base64,").
// FileReader.readAsDataURL отдаёт строку вида "data:image/png;base64,iVBORw0...", здесь берётся часть после запятой.
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const commaIndex = dataUrl.indexOf(',')
      resolve(dataUrl.substring(commaIndex + 1))
    }
    reader.onerror = () => {
      reject(new Error('Не удалось прочитать файл'))
    }
    reader.readAsDataURL(file)
  })
}

// GET CAPTCHA_URL -> {"captcha_id": "<uuid>", "image": "<PNG строкой base64>"}; ответ возвращается.
// Сервер запоминает ответ под captcha_id на 5 минут. Каждую капчу можно проверить только один раз:
// после любой отправки сообщения (даже неудачной) нужно запросить новую.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function getCaptcha() {
  const res = await apiFetch(CAPTCHA_URL)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

// POST на CREATE_NEW_MESSAGE_URL с заголовком Authorization: Bearer <token из localStorage>. Тело:
// {"login": "...", "email": "...", "topic_id": 1, "parent_message_id": null | 1, "t": "...",
//  "attachment": "<base64>" | null, "attachment_name": "photo.png" | null,
//  "site": "https://..." | null, "captcha_id": "<uuid>", "captcha": "123"}
// Автора сервер берёт из токена.
// site — Home page из формы, необязательное. Пустая строка (поле не заполнено) явно отправляется как null.
// captchaId — из getCaptcha, captcha — введённое пользователем число. Оба обязательны.
// Сервер помечает капчу использованной сразу, даже если потом отклонит запрос.
// topicId и parentMessageId должны быть числами (parentMessageId может быть null) — сервер строки не принимает.
// attachmentFile — объект File или null. Файл передаётся строкой base64 в поле "attachment",
// его имя — в "attachment_name"; без файла оба поля null.
// -> {"message_id", "parent_message_id", "topic_id", "user_id", "t", "created_at"}; ответ возвращается.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function createNewMessage(
  loginValue,
  email,
  topicId,
  parentMessageId,
  t,
  attachmentFile,
  site,
  captchaId,
  captcha,
) {
  let siteValue = null
  if (site !== '') {
    siteValue = site
  }

  let attachmentBase64 = null
  let attachmentName = null
  if (attachmentFile !== null) {
    attachmentBase64 = await readFileAsBase64(attachmentFile)
    attachmentName = attachmentFile.name
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const res = await apiFetch(CREATE_NEW_MESSAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      login: loginValue,
      email: email,
      topic_id: topicId,
      parent_message_id: parentMessageId,
      t: t,
      attachment: attachmentBase64,
      attachment_name: attachmentName,
      site: siteValue,
      captcha_id: captchaId,
      captcha: captcha,
    }),
  })
  throwIfSessionExpired(res)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}

// POST {"message_id": 1} на DELETE_EXISTING_MESSAGE_URL с заголовком Authorization: Bearer <token из localStorage>.
// messageId должен быть числом — сервер строки не принимает.
// Сервер удаляет только своё сообщение и вместе с ним все ответы на него.
// Тело успешного ответа не читается.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function deleteExistingMessage(messageId) {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const res = await apiFetch(DELETE_EXISTING_MESSAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message_id: messageId }),
  })
  throwIfSessionExpired(res)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
}

// GET url -> JSON-массив (сервер всегда отдаёт list()); ответ возвращается как есть.
// При ошибке текст — из readErrorMessage (или SERVER_UNAVAILABLE_MESSAGE, если сервер недоступен).
export async function getJson(url) {
  const res = await apiFetch(url)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res))
  }
  return res.json()
}
