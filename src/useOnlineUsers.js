import { useEffect, useState } from 'react'
import { API_BASE } from './api.js'

// Адрес WebSocket-соединения со списком онлайн (сервер: online.py, маршрут ws/online в app.py)
export const ONLINE_WS_PATH = '/ws/online'

// Пауза перед переподключением после обрыва, мс
const RECONNECT_DELAY_MS = 3000

// Список пользователей онлайн: [{ user_id, login }, ...], отсортирован сервером по login.
// Клиент ничего не опрашивает: держит одно WebSocket-соединение, а сервер сам присылает
// {"type": "online_users", "users": [...]} сразу после подключения и при каждом изменении.
// Список один для всех, в нём есть и сам пользователь — убирать себя должен вызывающий код.
//
// Без токена соединение не открывается и список пустой.
// При обрыве (перезапуск сервера или Redis, сеть, недействительный токен) переподключается через RECONNECT_DELAY_MS.
// При смене токена (выход, вход другим пользователем) старое соединение закрывается и открывается новое.
//
// Вызывать в ОДНОМ месте (сейчас — MainHeader): каждый вызов открывает своё соединение.
export function useOnlineUsers(token) {
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!token) {
      setOnlineUsers([])
      return
    }

    let socket = null
    let reconnectTimer = null
    // true после размонтирования или смены токена: тогда закрытие сокета — наше, переподключаться не надо
    let isStopped = false

    function connect() {
      // ws:// для http, wss:// для https. Адрес тот же, что у страницы:
      // при разработке запрос уходит через proxy Vite ('/ws' в vite.config.js) на сервер Django.
      // Токен — параметром адреса: заголовок Authorization браузер для WebSocket задать не даёт
      // Если задан API_BASE (сборка для хостинга), WebSocket идёт на тот же сервер: https:// -> wss://
      let url
      if (API_BASE !== '') {
        url = `${API_BASE.replace(/^http/, 'ws')}${ONLINE_WS_PATH}?token=${encodeURIComponent(token)}`
      } else {
        let protocol = 'ws:'
        if (window.location.protocol === 'https:') {
          protocol = 'wss:'
        }
        url = `${protocol}//${window.location.host}${ONLINE_WS_PATH}?token=${encodeURIComponent(token)}`
      }
      socket = new WebSocket(url)

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === 'online_users') {
          setOnlineUsers(message.users)
        }
      }

      socket.onclose = () => {
        if (!isStopped) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      }
    }

    connect()

    return () => {
      isStopped = true
      clearTimeout(reconnectTimer)
      socket.close()
      setOnlineUsers([])
    }
  }, [token])

  return onlineUsers
}
