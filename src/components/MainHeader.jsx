import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function MainHeader() {
  const navigate = useNavigate()
  const { userLogin, userEmail } = useAuth()
  const { token, login, logout } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

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

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <header className="main-header">
      <h2><Link to="/">MyForum</Link></h2>
      {token ? (
        <div>
          {userLogin} ({userEmail}) &nbsp; <button type="button" onClick={handleLogout}>Выйти</button>
        </div>
      ) : (
        <form onSubmit={handleLogin}>
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
          <button type="submit">Войти</button>
        </form>
      )}
      {error && <p className="error">Ошибка: {error}</p>}
    </header>
  )
}
