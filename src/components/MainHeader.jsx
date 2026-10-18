import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { useOnlineUsers } from '../useOnlineUsers.js'

export default function MainHeader() {
  const navigate = useNavigate()
  const { userLogin, userEmail, token, login, logout } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  // Единственное место, где открывается WebSocket-соединение со списком онлайн: шапка есть на всех страницах
  const onlineUsers = useOnlineUsers(token)

  // Сервер шлёт один список для всех, вместе с текущим пользователем — убираем себя
  const otherOnlineLogins = []
  for (const user of onlineUsers) {
    if (user.login !== userLogin) {
      otherOnlineLogins.push(user.login)
    }
  }
  let otherOnlineText = 'никого'
  if (otherOnlineLogins.length > 0) {
    otherOnlineText = otherOnlineLogins.join(', ')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    try {
      await login(loginValue, password)
      setPassword('')
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  // На главную — в любом случае, даже если запрос на /api/logout не удался:
  // токен на клиенте уже удалён, а открытые диалоги и страницы темы должны закрыться
  async function handleLogout() {
    try {
      await logout()
    } catch (err) {
      setError(err.message)
    }
    navigate('/')
  }

  return (
    <header className="main-header">
      <h2><Link to="/">MyForum</Link></h2>
      {token ? (
        <div>
          {userLogin} ({userEmail}) &nbsp; <button type="button" className="primary-button" onClick={handleLogout}>Выйти</button>
        </div>
      ) : (
        <form className="header-login-form" onSubmit={handleLogin}>
          <input
            type="text"
            name="login"
            placeholder="Логин"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="primary-button">Войти</button>
        </form>
      )}
      {error && <p className="error">Ошибка: {error}</p>}
      {/* Только вошедшему: без токена соединение не открывается */}
      {token && (
        <p className="header-online">
          Онлайн, кроме вас: {otherOnlineText}
        </p>
      )}
    </header>
  )
}
