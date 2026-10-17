import { createContext, useContext, useEffect, useState } from 'react'
import {
  TOKEN_STORAGE_KEY,
  LOGIN_STORAGE_KEY,
  EMAIL_STORAGE_KEY,
  login as apiLogin,
  logout as apiLogout,
  createNewUser as apiCreateNewUser,
  setSessionExpiredHandler,
} from '../api.js'

// Общее состояние входа: токен, логин и email пользователя и функции login/logout/createNewUser.
// Они хранятся и в state (чтобы компоненты перерисовывались), и в localStorage (чтобы пережить перезагрузку страницы).
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY))
  const [userLogin, setUserLogin] = useState(localStorage.getItem(LOGIN_STORAGE_KEY))
  const [userEmail, setUserEmail] = useState(localStorage.getItem(EMAIL_STORAGE_KEY))

  // Когда защищённый запрос получил 401, api.js сам чистит localStorage и вызывает эту функцию,
  // а здесь очищается state. Регистрируется один раз, после первой отрисовки AuthProvider ([] в зависимостях).
  // Не снимается: AuthProvider обёрнут вокруг всего приложения в main.jsx и не размонтируется.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setToken(null)
      setUserLogin(null)
      setUserEmail(null)
    })
  }, [])

  // api.login сохраняет токен, логин и email в localStorage, здесь они кладутся в state
  async function login(loginValue, password) {
    const data = await apiLogin(loginValue, password)
    setToken(data.token)
    setUserLogin(data.login)
    setUserEmail(data.email)
  }

  // state очищается сразу; api.logout удаляет токен, логин и email из localStorage и вызывает сервер
  async function logout() {
    setToken(null)
    setUserLogin(null)
    setUserEmail(null)
    await apiLogout()
  }

  // Регистрация. Сервер сразу возвращает токен, поэтому пользователь после неё уже вошёл.
  // api.createNewUser сохраняет токен, логин и email в localStorage, здесь они кладутся в state
  async function createNewUser(loginValue, email, password) {
    const data = await apiCreateNewUser(loginValue, email, password)
    setToken(data.token)
    setUserLogin(data.login)
    setUserEmail(data.email)
  }

  return (
    <AuthContext.Provider
      value={{
        token: token,
        userLogin: userLogin,
        userEmail: userEmail,
        login: login,
        logout: logout,
        createNewUser: createNewUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Возвращает { token, userLogin, userEmail, login, logout, createNewUser }. Работает только внутри <AuthProvider>.
export function useAuth() {
  return useContext(AuthContext)
}
