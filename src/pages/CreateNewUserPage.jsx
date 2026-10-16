import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNewUser } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function CreateNewUserPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }

    try {
      await createNewUser(loginValue, password)
      // Сразу входим созданным пользователем
      await login(loginValue, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
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
        <input
          type="password"
          name="password_confirm"
          placeholder="Подтверждение пароля"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
        <button type="submit">Создать</button>
      </form>
      {error && <p className="error">Ошибка: {error}</p>}
    </div>
  )
}
