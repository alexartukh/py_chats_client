import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getLoginError, getEmailError } from '../inputValidation.js'

export default function CreateNewUserPage() {
  const navigate = useNavigate()
  const { createNewUser } = useAuth()
  const [loginValue, setLoginValue] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Те же проверки, что на сервере (см. inputValidation.js) — чтобы не отправлять заведомо неверные данные
    const loginError = getLoginError(loginValue)
    if (loginError !== null) {
      setError(loginError)
      return
    }

    const emailError = getEmailError(email)
    if (emailError !== null) {
      setError(emailError)
      return
    }

    if (password !== passwordConfirm) {
      setError('Пароли не совпадают')
      return
    }

    try {
      // Сервер в ответе возвращает токен — после этого пользователь уже вошёл
      await createNewUser(loginValue, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="column">
      <h2>Регистрация</h2>
      {/* Оформление как у формы сообщения (EnterMessage): подпись над полем, * у обязательных, кнопка справа */}
      <form className="entry-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Логин <span className="required-mark">*</span></span>
          <input
            type="text"
            name="login"
            required={true}
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Email <span className="required-mark">*</span></span>
          <input
            type="text"
            name="email"
            required={true}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Пароль <span className="required-mark">*</span></span>
          <input
            type="password"
            name="password"
            required={true}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Подтверждение пароля <span className="required-mark">*</span></span>
          <input
            type="password"
            name="password_confirm"
            required={true}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </label>

        {error && <p className="error">Ошибка: {error}</p>}

        <div className="form-buttons">
          <button type="submit" className="primary-button">Создать</button>
        </div>
      </form>
    </div>
  )
}
